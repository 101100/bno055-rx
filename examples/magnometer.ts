/*
 * examples/magnometer.ts
 * https://github.com/101100/bno055-rx
 *
 * Example to stream magnometer values.
 *
 * Copyright (c) 2018 Jason Heard
 * Licensed under the MIT license.
 */

import * as i2cBus from "i2c-bus";
import printf from "printf";
import { take } from "rxjs/operators";

import { Bno055Driver } from "../index";


const bno055 = new Bno055Driver({
    // uncomment for debugging information
    // debug: true,
    i2c: i2cBus.openSync(1),
    mode: "magonly",
    // replace with calibration data for accurate results
    calibrationData: {
        accelerometerOffset: { x: 0, y: 0, z: 0 },
        accelerometerRadius: 0,
        gyroscopeOffset: { x: 0, y: 0, z: 0 },
        magnetometerOffset: { x: 0, y: 0, z: 0 },
        magnetometerRadius: 0
    }
});


console.log("Reading 50 magnometer values (once calibration is complete)...");
bno055.streamMagnometer()
    .pipe(
        take(50)
    )
    .subscribe(
        next => console.log(printf("x: % 6.2f, y: % 6.2f, z: % 6.2f", next.x, next.y, next.z)),
        (err: any) => console.log("Error: " + err),
        () => console.log("Conpleted")
    );
