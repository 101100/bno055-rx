/*
 * src/bno055.ts
 * https://github.com/101100/bno055-rx
 *
 * Library for BNO055 I2C absolute orientation sensor.
 *
 * Copyright (c) 2018 Jason Heard
 * Licensed under the MIT license.
 */

import * as debugFactory from "debug";
import { polyfill as promisePolyfill } from "es6-promise";
import { I2cBus } from "i2c-bus";
import { Observable, concat as concatObservable, empty as emptyObservable, merge as mergeObservable, throwError as throwObservable, timer as timerObservable, ReplaySubject, zip as zipObservable } from "rxjs";
import { catchError, mergeMap, tap, takeWhile, timeout, ignoreElements, publish, map, take } from "rxjs/operators";

import constants from "./constants";


type ByteReader = (register: number) => Observable<number>;
type BytesReader = (register: number, length: number) => Observable<Buffer>;
type ByteWriter = (register: number, value: number) => Observable<never>;


export interface Quaternion {
    w: number;
    x: number;
    y: number;
    z: number;
}


export interface Vector {
    x: number;
    y: number;
    z: number;
}


export type Bno055Mode = "acconly" | "magonly" | "gyronly"
    | "accmag" | "accgyro" | "maggyro" | "amg" | "imuplus" | "compass"
    | "m4g" | "ndof_fmc_off" | "ndof";


type Bno055ModeWithConfig = "config" | Bno055Mode;


export interface Bno055CalibrationData {
    accelerometerOffset: Vector;
    accelerometerRadius: number;
    gyroscopeOffset: Vector;
    magnetometerOffset: Vector;
    magnetometerRadius: number;
}


export interface Bno055Options {
    i2c: I2cBus;
    address?: number;
    calibrationData?: Bno055CalibrationData;
    mode: Bno055Mode;
    debug?: boolean;
}


export class Bno055Driver {
    constructor(options: Bno055Options) {
        if (options.debug) {
            debugFactory.enable("lsm303");
        }
        this._debug = debugFactory("lsm303");

        // polyfill 'Promise' in case we are running on Node.js before v0.12
        promisePolyfill();

        const i2cObject = options.i2c;
        const address = options.address || constants.ADDRESS_A;

        this._debug(`Address is 0x${address.toString(16)}`);

        this._readByte = function (register: number): Observable<number> {
            return new Observable<number>(subscriber => {
                i2cObject.readByte(address, register, (err, byte) => {
                    if (err) {
                        subscriber.error(err);
                    } else {
                        subscriber.next(byte);
                        subscriber.complete();
                    }
                });
            });
        };

        this._readBytes = function (register: number, length: number): Observable<Buffer> {
            return new Observable<Buffer>(subscriber => {
                const buffer = new Buffer(length);
                i2cObject.readI2cBlock(address, register, length, buffer, (err, bytesRead) => {
                    if (err) {
                        subscriber.error(err);
                    } else if (bytesRead !== length) {
                        subscriber.error(`Incorrect number of bytes read (expected: ${length}, recieved: ${bytesRead})`);
                    } else {
                        subscriber.next(buffer);
                        subscriber.complete();
                    }
                });
            });
        };

        this._writeByte = function (register: number, byte: number): Observable<never> {
                return new Observable<never>(subscriber => {
                    i2cObject.writeByte(address, register, byte, err => {
                        if (err) {
                            subscriber.error(err);
                        } else {
                            subscriber.complete();
                        }
                    });
                });
            };

        // the initialization stream is published so it begins immediately
        this._preCalibrationInitializationStream = publish<never>()(this._initializePreCalibration()).refCount();
        this._initializationStream = publish<never>()(this._initialize(options.mode, options.calibrationData)).refCount();
    }


    getCalibrationData(): Observable<Bno055CalibrationData> {
        return concatObservable(
            this._preCalibrationInitializationStream,
            this._awaitCalibration(),
            this._readCalibration()
        );
    }


    streamAccelerometer(interval: number = 100): Observable<Vector> {
        return concatObservable(
            this._initializationStream,
            this._createIntervalStream(interval)
                .pipe(
                    mergeMap(() => this._readVector(constants.ACCEL_DATA_START, constants.ACCEL_DATA_LSB_TO_METERS_PER_SECOND_SQUARED_DIVISOR, "acceleration"))
                )
        );
    }


    streamGyroscope(interval: number = 100): Observable<Vector> {
        return concatObservable(
            this._initializationStream,
            this._createIntervalStream(interval)
                .pipe(
                    mergeMap(() => this._readVector(constants.GYRO_DATA_START, constants.GYRO_DATA_LSB_TO_DPS_DIVISOR, "gyroscope"))
                )
        );
    }


    streamMagnometer(interval: number = 100, rawData: boolean = false): Observable<Vector> {
        return concatObservable(
            this._initializationStream,
            this._createIntervalStream(interval)
                .pipe(
                    mergeMap(() => this._readVector(constants.MAG_DATA_START, constants.MAG_DATA_LSB_TO_MICRO_TESLA_DIVISOR, "magnometer"))
                )
        );
    }


    streamQuaternions(interval: number = 100): Observable<Quaternion> {
        return concatObservable(
            this._initializationStream,
            this._createIntervalStream(interval)
                .pipe(
                    mergeMap(() => this._readQuaternion(constants.QUATERNION_DATA_START))
                )
        );
    }


    private _awaitCalibrationPart(bitsToCheck: number, name: string): Observable<never> {
        return timerObservable(0, 100) // try every 100 ms
            .pipe(
                mergeMap(_ => this._readByte(constants.CALIB_STAT)), // read the calibration byte
                takeWhile(byte => (byte & bitsToCheck) !== bitsToCheck), // finish when the bits to check are set
                tap(undefined, undefined, () => this._debug(`Calibration complete: ${name}`)),
                ignoreElements()
            );
    }


    private _awaitCalibration(): Observable<never> {
        return concatObservable(
            this._setMode("ndof_fmc_off"),
            mergeObservable(
                this._awaitCalibrationPart(0x03, "magnetometer"),
                this._awaitCalibrationPart(0x0C, "accelerometer"),
                this._awaitCalibrationPart(0x30, "gyroscope"),
                this._awaitCalibrationPart(0xC0, "system")
            )
        );
    }


    private _confirmBoot(): Observable<never> {
        return timerObservable(0, 100) // try every 100 ms
            .pipe(
                tap(() => this._debug("Reading ID byte to confirm boot")),
                mergeMap(_ => this._readByte(constants.CHIP_ID)), // read the ID byte
                tap(idByte => this._debug(`Read ID byte of 0x${idByte.toString(16)}`)),
                takeWhile(byte => byte !== constants.BNO055_ID), // finish when correct ID is read
                ignoreElements(), // don't output non-ID values
                tap(undefined, undefined, () => this._debug("Boot confirmation done."))
                // timeout(10000) // give up after 1000 ms
                // catchError(_ => throwObservable("Could not confirm the Bno055 module ID."))
            );
    }


    private _confirmSelfTest(): Observable<never> {
        return this._readByte(constants.SELFTEST_RESULT)
            .pipe(
                tap(selfTestResult => this._debug(`Self test result is 0x${selfTestResult.toString(16)}`)),
                mergeMap(byte => (byte & 0xF) === 0xF ? emptyObservable() : throwObservable(`Self test failed, got 0x${byte.toString(16)}.`))
            );
    }


    private _createIntervalStream(interval: number): Observable<number> {
        return timerObservable(0, interval);
    }


    private _delay(delayInMs: number): Observable<never> {
        return timerObservable(1000).pipe(ignoreElements());
    }


    private _ensurePage(page: 0 | 1): Observable<never> {
        return this._readByte(constants.PAGE_ID)
            .pipe(
                tap(pageId => this._debug(`Page ID is 0x${pageId.toString(16)}`)),
                mergeMap(byte => byte === page ? emptyObservable() : this._writeByte(constants.PAGE_ID, page))
            );
    }


    private _initialize(
        mode: Bno055Mode,
        calibrationData?: Bno055CalibrationData
    ): Observable<never> {
        return concatObservable(
            // wait for pre-calibration initialization
            this._preCalibrationInitializationStream,

            // TODO: initialize orientation (if given)

            // initialize calibration from user or wait for calibration
            this._setOrAwaitCalibrationData(calibrationData),

            // set in sensor mode given by user
            this._setMode(mode)
        ).pipe(
            tap(undefined, undefined, () => { this._debug("Initialization complete"); })
        );
    }


    private _initializePreCalibration(): Observable<never> {
        this._debug("Starting initialization");
        return concatObservable(
            // ensure the Bno055 module is there and ready
            this._confirmBoot(),

            // ensure we are on page 0
            this._ensurePage(0),

            // ensure self test passed
            this._confirmSelfTest(),

            // set in configuration mode (to allow reset)
            this._setMode("config"),

            // reset module to restore defaults
            this._reset(),

            // wait for the Bno055 module to finish resetting
            this._confirmBoot()
        ).pipe(
            tap(undefined, undefined, () => { this._debug("Pre-calibration initialization complete"); })
        );
    }


    private _reset(): Observable<never> {
        return concatObservable(
            this._writeByte(constants.SYS_TRIGGER, constants.SYSTEM_TRIGGER_RESET),
            this._delay(1000)
        ).pipe(
            tap(undefined, undefined, () => { this._debug("Initiated reset"); })
        );
        // reset reset register to zero?!?
    }


    private _readCalibration(): Observable<Bno055CalibrationData> {
        return zipObservable(
            this._readVector(constants.ACCEL_OFFSET_START, 1, "accelerometer offset"),
            this._readNumber(constants.ACCEL_RADIUS_LSB, "accelerometer radius"),
            this._readVector(constants.GYRO_OFFSET_START, 1, "gyroscope offset"),
            this._readVector(constants.MAG_OFFSET_START, 1, "magnometer offset"),
            this._readNumber(constants.MAG_RADIUS_LSB, "acceleration radius")
        ).pipe(
            take(1),
            map(([accelerometerOffset, accelerometerRadius, gyroscopeOffset, magnetometerOffset, magnetometerRadius]) =>
                ({ accelerometerOffset, accelerometerRadius, gyroscopeOffset, magnetometerOffset, magnetometerRadius }))
        );
    }


    private _readNumber(lsbAddress: number, debugName: string): Observable<number> {
        // numbers are always LSB then MSB
        return this._readBytes(lsbAddress, 2)
            .pipe(
                map(buffer => fromInt16((buffer[1] << 8) | buffer[0])),
                tap(x => {
                    if (this._debug.enabled) {
                        this._debug(`Read ${debugName}: ${x}`);
                    }
                })
            );
    }


    private _readQuaternion(startAddress: number): Observable<Quaternion> {
        return this._readBytes(startAddress, 8)
            .pipe(
                map(Bno055Driver._bufferToQuaternion),
                tap(x => {
                    if (this._debug.enabled) {
                        this._debug(`Read quaternion: ${JSON.stringify(x)}`);
                    }
                })
            );
    }


    private _readVector(startAddress: number, divisor: number, debugName: string): Observable<Vector> {
        return this._readBytes(startAddress, 6)
            .pipe(
                map(buffer => Bno055Driver._bufferToVector(buffer, divisor)),
                tap(x => {
                    if (this._debug.enabled) {
                        this._debug(`Read ${debugName}: ${JSON.stringify(x)}`);
                    }
                })
            );
    }


    private _setMode(mode: Bno055ModeWithConfig): Observable<never> {
        const modeValue = mode === "accgyro" ? constants.OPERATION_MODE_ACCGYRO
            : mode === "accmag" ? constants.OPERATION_MODE_ACCMAG
            : mode === "acconly" ? constants.OPERATION_MODE_ACCONLY
            : mode === "amg" ? constants.OPERATION_MODE_AMG
            : mode === "compass" ? constants.OPERATION_MODE_COMPASS
            : mode === "gyronly" ? constants.OPERATION_MODE_GYRONLY
            : mode === "imuplus" ? constants.OPERATION_MODE_IMUPLUS
            : mode === "m4g" ? constants.OPERATION_MODE_M4G
            : mode === "maggyro" ? constants.OPERATION_MODE_MAGGYRO
            : mode === "magonly" ? constants.OPERATION_MODE_MAGONLY
            : mode === "ndof" ? constants.OPERATION_MODE_NDOF
            : mode === "ndof_fmc_off" ? constants.OPERATION_MODE_NDOF_FMC_OFF
            : constants.OPERATION_MODE_CONFIG;

        return concatObservable(
            this._writeByte(constants.OPR_MODE, modeValue),
            this._delay(30)
        ).pipe(tap(undefined, undefined, () => this._debug(`Set mode to ${mode} with byte 0x${modeValue.toString(16)}`)));
    }


    private _setOrAwaitCalibrationData(calibrationData?: Bno055CalibrationData): Observable<never> {
        if (calibrationData) {
            return this._writeCalibrationData(calibrationData);
        } else {
            // wait for calibration state to be correct
            return this._awaitCalibration();
        }
    }


    private _writeCalibrationData(calibrationData: Bno055CalibrationData): Observable<never> {
        return concatObservable(
            this._writeByte(constants.ACCEL_OFFSET_X_LSB, int16ToLsb(calibrationData.accelerometerOffset.x)),
            this._writeByte(constants.ACCEL_OFFSET_X_MSB, int16ToMsb(calibrationData.accelerometerOffset.x)),
            this._writeByte(constants.ACCEL_OFFSET_Y_LSB, int16ToLsb(calibrationData.accelerometerOffset.y)),
            this._writeByte(constants.ACCEL_OFFSET_Y_MSB, int16ToMsb(calibrationData.accelerometerOffset.y)),
            this._writeByte(constants.ACCEL_OFFSET_Z_LSB, int16ToLsb(calibrationData.accelerometerOffset.z)),
            this._writeByte(constants.ACCEL_OFFSET_Z_MSB, int16ToMsb(calibrationData.accelerometerOffset.z)),
            this._writeByte(constants.ACCEL_RADIUS_LSB, int16ToLsb(calibrationData.accelerometerRadius)),
            this._writeByte(constants.ACCEL_RADIUS_MSB, int16ToMsb(calibrationData.accelerometerRadius)),
            this._writeByte(constants.GYRO_OFFSET_X_LSB, int16ToLsb(calibrationData.gyroscopeOffset.x)),
            this._writeByte(constants.GYRO_OFFSET_X_MSB, int16ToMsb(calibrationData.gyroscopeOffset.x)),
            this._writeByte(constants.GYRO_OFFSET_Y_LSB, int16ToLsb(calibrationData.gyroscopeOffset.y)),
            this._writeByte(constants.GYRO_OFFSET_Y_MSB, int16ToMsb(calibrationData.gyroscopeOffset.y)),
            this._writeByte(constants.GYRO_OFFSET_Z_LSB, int16ToLsb(calibrationData.gyroscopeOffset.z)),
            this._writeByte(constants.GYRO_OFFSET_Z_MSB, int16ToMsb(calibrationData.gyroscopeOffset.z)),
            this._writeByte(constants.MAG_OFFSET_X_LSB, int16ToLsb(calibrationData.magnetometerOffset.x)),
            this._writeByte(constants.MAG_OFFSET_X_MSB, int16ToMsb(calibrationData.magnetometerOffset.x)),
            this._writeByte(constants.MAG_OFFSET_Y_LSB, int16ToLsb(calibrationData.magnetometerOffset.y)),
            this._writeByte(constants.MAG_OFFSET_Y_MSB, int16ToMsb(calibrationData.magnetometerOffset.y)),
            this._writeByte(constants.MAG_OFFSET_Z_LSB, int16ToLsb(calibrationData.magnetometerOffset.z)),
            this._writeByte(constants.MAG_OFFSET_Z_MSB, int16ToMsb(calibrationData.magnetometerOffset.z)),
            this._writeByte(constants.MAG_RADIUS_LSB, int16ToLsb(calibrationData.magnetometerRadius)),
            this._writeByte(constants.MAG_RADIUS_MSB, int16ToMsb(calibrationData.magnetometerRadius))
        );
    }


    private static _bufferToQuaternion(buffer: Buffer): Quaternion {
        // the quaternion has the order: W (LSB then MSB), X (LSB then MSB), Y (LSB then MSB), Z (LSB then MSB)
        return {
            w: fromInt16((buffer[1] << 8) | buffer[0]) / constants.QUATERNION_DATA_LSB_TO_DPS_DIVISOR,
            x: fromInt16((buffer[3] << 8) | buffer[2]) / constants.QUATERNION_DATA_LSB_TO_DPS_DIVISOR,
            y: fromInt16((buffer[5] << 8) | buffer[4]) / constants.QUATERNION_DATA_LSB_TO_DPS_DIVISOR,
            z: fromInt16((buffer[7] << 8) | buffer[6]) / constants.QUATERNION_DATA_LSB_TO_DPS_DIVISOR
        };
    }


    private static _bufferToVector(buffer: Buffer, divisor: number): Vector {
        // all of the vectors have the same order: X (LSB then MSB), Y (LSB then MSB), Z (LSB then MSB)
        return {
            x: fromInt16((buffer[1] << 8) | buffer[0]) / divisor,
            y: fromInt16((buffer[3] << 8) | buffer[2]) / divisor,
            z: fromInt16((buffer[5] << 8) | buffer[4]) / divisor
        };
    }


    private readonly _calibrationDataStream = new ReplaySubject<Bno055CalibrationData>();
    private readonly _debug: debugFactory.IDebugger;
    private readonly _preCalibrationInitializationStream: Observable<never>;
    private readonly _initializationStream: Observable<never>;
    private readonly _readByte: ByteReader;
    private readonly _readBytes: BytesReader;
    private readonly _writeByte: ByteWriter;

}


function fromInt16(int16: number): number {
    // if sign bit is set, convert to negative value
    if (0x8000 & int16) {
        return int16 - 0x10000;
    } else {
        return int16;
    }
}


function int16ToLsb(int16: number): number {
    // if negative, manually set sign bit
    if (int16 < 0) {
        return (int16 + 0x10000) && 0xff;
    } else {
        return int16 & 0xff;
    }
}


function int16ToMsb(int16: number): number {
    // if negative, manually set sign bit
    if (int16 < 0) {
        return (int16 + 0x10000) >> 8 && 0xff;
    } else {
        return int16 >> 8 & 0xff;
    }
}
