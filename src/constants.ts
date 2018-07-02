/*
 * src/constants.ts
 * https://github.com/101100/bno055-rx
 *
 * Constants for BNO055 I2C absolute orientation sensor.
 *
 * Values taken from https://github.com/BlueRival/node-BNO055
 * based on https://www.adafruit.com/datasheets/BST_BNO055_DS000_12.pdf
 *
 * Copyright (c) 2018 Jason Heard
 * Licensed under the MIT license.
 */

export default {
    BNO055_ID: 0xA0,

    // PAGE0 REGISTER DEFINITION START
    CHIP_ID: 0x00,
    ACCEL_REV_ID: 0x01,
    MAG_REV_ID: 0x02,
    GYRO_REV_ID: 0x03,
    SW_REV_ID_LSB: 0x04,
    SW_REV_ID_MSB: 0x05,
    BL_REV_ID: 0X06,
    PAGE_ID: 0X07,

    // Accel data register
    ACCEL_DATA_START: 0X08,
    ACCEL_DATA_X_LSB: 0X08,
    ACCEL_DATA_X_MSB: 0X09,
    ACCEL_DATA_Y_LSB: 0X0A,
    ACCEL_DATA_Y_MSB: 0X0B,
    ACCEL_DATA_Z_LSB: 0X0C,
    ACCEL_DATA_Z_MSB: 0X0D,
    ACCEL_DATA_LSB_TO_METERS_PER_SECOND_SQUARED_DIVISOR: 100,

    // Mag data register
    MAG_DATA_START: 0X0E,
    MAG_DATA_X_LSB: 0X0E,
    MAG_DATA_X_MSB: 0X0F,
    MAG_DATA_Y_LSB: 0X10,
    MAG_DATA_Y_MSB: 0X11,
    MAG_DATA_Z_LSB: 0X12,
    MAG_DATA_Z_MSB: 0X13,
    MAG_DATA_LSB_TO_MICRO_TESLA_DIVISOR: 16,

    // Gyro data registers
    GYRO_DATA_START: 0X14,
    GYRO_DATA_X_LSB: 0X14,
    GYRO_DATA_X_MSB: 0X15,
    GYRO_DATA_Y_LSB: 0X16,
    GYRO_DATA_Y_MSB: 0X17,
    GYRO_DATA_Z_LSB: 0X18,
    GYRO_DATA_Z_MSB: 0X19,
    GYRO_DATA_LSB_TO_DPS_DIVISOR: 16,

    // Euler data registers
    EULER_START: 0X1A,
    EULER_H_LSB: 0X1A,
    EULER_H_MSB: 0X1B,
    EULER_R_LSB: 0X1C,
    EULER_R_MSB: 0X1D,
    EULER_P_LSB: 0X1E,
    EULER_P_MSB: 0X1F,
    EULER_DATA_LSB_TO_DEGREES_DIVISOR: 16,

    // Quaternion data registers
    QUATERNION_DATA_START: 0X20,
    QUATERNION_DATA_W_LSB: 0X20,
    QUATERNION_DATA_W_MSB: 0X21,
    QUATERNION_DATA_X_LSB: 0X22,
    QUATERNION_DATA_X_MSB: 0X23,
    QUATERNION_DATA_Y_LSB: 0X24,
    QUATERNION_DATA_Y_MSB: 0X25,
    QUATERNION_DATA_Z_LSB: 0X26,
    QUATERNION_DATA_Z_MSB: 0X27,
    QUATERNION_DATA_LSB_TO_DPS_DIVISOR: 1 << 14, // 2^14

    // Linear acceleration data registers
    LINEAR_ACCEL_DATA_START: 0X28,
    LINEAR_ACCEL_DATA_X_LSB: 0X28,
    LINEAR_ACCEL_DATA_X_MSB: 0X29,
    LINEAR_ACCEL_DATA_Y_LSB: 0X2A,
    LINEAR_ACCEL_DATA_Y_MSB: 0X2B,
    LINEAR_ACCEL_DATA_Z_LSB: 0X2C,
    LINEAR_ACCEL_DATA_Z_MSB: 0X2D,
    LINEAR_ACCEL_DATA_LSB_TO_METERS_PER_SECOND_SQUARED_DIVISOR: 100,

    // Gravity data registers
    GRAVITY_DATA_START: 0X2E,
    GRAVITY_DATA_X_LSB: 0X2E,
    GRAVITY_DATA_X_MSB: 0X2F,
    GRAVITY_DATA_Y_LSB: 0X30,
    GRAVITY_DATA_Y_MSB: 0X31,
    GRAVITY_DATA_Z_LSB: 0X32,
    GRAVITY_DATA_Z_MSB: 0X33,
    GRAVITY_DATA_LSB_TO_METERS_PER_SECOND_SQUARED_DIVISOR: 100,

    // Temperature data register
    TEMP: 0X34,

    // Status registers
    CALIB_STAT: 0X35,
    SELFTEST_RESULT: 0X36,
    INTR_STAT: 0X37,

    SYS_CLK_STAT: 0X38,
    SYS_STAT: 0X39,
    SYS_ERR: 0X3A,

    // Unit selection register
    UNIT_SEL: 0X3B,
    DATA_SELECT: 0X3C,

    // Mode registers
    OPR_MODE: 0X3D,
    PWR_MODE: 0X3E,

    SYS_TRIGGER: 0X3F,
    TEMP_SOURCE: 0X40,

    // Axis remap registers
    AXIS_MAP_CONFIG: 0X41,
    AXIS_MAP_SIGN: 0X42,

    // SIC registers
    SIC_MATRIX_0_LSB: 0X43,
    SIC_MATRIX_0_MSB: 0X44,
    SIC_MATRIX_1_LSB: 0X45,
    SIC_MATRIX_1_MSB: 0X46,
    SIC_MATRIX_2_LSB: 0X47,
    SIC_MATRIX_2_MSB: 0X48,
    SIC_MATRIX_3_LSB: 0X49,
    SIC_MATRIX_3_MSB: 0X4A,
    SIC_MATRIX_4_LSB: 0X4B,
    SIC_MATRIX_4_MSB: 0X4C,
    SIC_MATRIX_5_LSB: 0X4D,
    SIC_MATRIX_5_MSB: 0X4E,
    SIC_MATRIX_6_LSB: 0X4F,
    SIC_MATRIX_6_MSB: 0X50,
    SIC_MATRIX_7_LSB: 0X51,
    SIC_MATRIX_7_MSB: 0X52,
    SIC_MATRIX_8_LSB: 0X53,
    SIC_MATRIX_8_MSB: 0X54,

    // Accelerometer Offset registers
    ACCEL_OFFSET_START: 0X55,
    ACCEL_OFFSET_X_LSB: 0X55,
    ACCEL_OFFSET_X_MSB: 0X56,
    ACCEL_OFFSET_Y_LSB: 0X57,
    ACCEL_OFFSET_Y_MSB: 0X58,
    ACCEL_OFFSET_Z_LSB: 0X59,
    ACCEL_OFFSET_Z_MSB: 0X5A,

    // Magnetometer Offset registers
    MAG_OFFSET_START: 0X55,
    MAG_OFFSET_X_LSB: 0X5B,
    MAG_OFFSET_X_MSB: 0X5C,
    MAG_OFFSET_Y_LSB: 0X5D,
    MAG_OFFSET_Y_MSB: 0X5E,
    MAG_OFFSET_Z_LSB: 0X5F,
    MAG_OFFSET_Z_MSB: 0X60,

    // Gyroscope Offset register s
    GYRO_OFFSET_START: 0X55,
    GYRO_OFFSET_X_LSB: 0X61,
    GYRO_OFFSET_X_MSB: 0X62,
    GYRO_OFFSET_Y_LSB: 0X63,
    GYRO_OFFSET_Y_MSB: 0X64,
    GYRO_OFFSET_Z_LSB: 0X65,
    GYRO_OFFSET_Z_MSB: 0X66,

    // Radius registers
    ACCEL_RADIUS_LSB: 0X67,
    ACCEL_RADIUS_MSB: 0X68,
    MAG_RADIUS_LSB: 0X69,
    MAG_RADIUS_MSB: 0X6A,

    // I2C addresses
    ADDRESS_A: 0x28,
    ADDRESS_B: 0x29,

    // Power modes
    POWER_MODE_NORMAL: 0X00,
    POWER_MODE_LOWPOWER: 0X01,
    POWER_MODE_SUSPEND: 0X02,

    // Operation mode settings
    OPERATION_MODE_CONFIG: 0X00,
    OPERATION_MODE_ACCONLY: 0X01,
    OPERATION_MODE_MAGONLY: 0X02,
    OPERATION_MODE_GYRONLY: 0X03,
    OPERATION_MODE_ACCMAG: 0X04,
    OPERATION_MODE_ACCGYRO: 0X05,
    OPERATION_MODE_MAGGYRO: 0X06,
    OPERATION_MODE_AMG: 0X07,
    OPERATION_MODE_IMUPLUS: 0X08,
    OPERATION_MODE_COMPASS: 0X09,
    OPERATION_MODE_M4G: 0X0A,
    OPERATION_MODE_NDOF_FMC_OFF: 0X0B,
    OPERATION_MODE_NDOF: 0X0C,

    SYSTEM_TRIGGER_RESET: 0x20,

    // Axis remap values
    AXIS_REMAP_X: 0x00,
    AXIS_REMAP_Y: 0x01,
    AXIS_REMAP_Z: 0x02,
    AXIS_REMAP_POSITIVE: 0x00,
    AXIS_REMAP_NEGATIVE: 0x01
};