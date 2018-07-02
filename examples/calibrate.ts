/*
 * examples/calibrate.ts
 * https://github.com/101100/bno055-rx
 *
 * Example that can be used to determine the calibration data to allow for
 * faster initialization of the module.
 *
 * Copyright (c) 2018 Jason Heard
 * Licensed under the MIT license.
 */

import * as i2cBus from "i2c-bus";

import { Bno055Driver } from "../index";


const bno055 = new Bno055Driver({
    // uncomment for debugging information
    // debug: true,
    i2c: i2cBus.openSync(1),
    mode: "ndof"
});


console.log("Perform the following actions to calibrate all of the sensors (CTRL-C to abort):");
console.log();
console.log("- Place the device in 6 different stable positions for a period of few seconds");
console.log("  to allow the accelerometer to calibrate.");
console.log("    - Make sure that there is slow movement between 2 stable positions.");
console.log("    - The 6 stable positions could be in any direction, but make sure that the");
console.log("      device is lying at least once perpendicular to the x, y and z axis.");
console.log("- Place the device in a single stable position for a period of few seconds to");
console.log("  allow the gyroscope to calibrate.");
console.log("- Make some random movements (for example: writing the number ‘8’ in the air)");
console.log("  to allow the magnometer to calibrate.");
bno055.getCalibrationData()
    .subscribe(
        calibrationData => {
            console.log("Calibration data:");
            console.log(calibrationData);
        },
        (err: any) => console.log("Error: " + err),
        () => console.log("Calibration completed; use the above calidbration data to speed up the other examples.")
    );
