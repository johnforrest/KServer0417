import { Cartesian3 } from "./cartesian3";

/**
 *按列存储的矩阵
 *
 * @class Matrix4
 */
class Matrix4 {
  private _data: number[] = [];

  constructor(
    c0r0: number = 0,
    c1r0: number = 0,
    c2r0: number = 0,
    c3r0: number = 0,
    c0r1: number = 0,
    c1r1: number = 0,
    c2r1: number = 0,
    c3r1: number = 0,
    c0r2: number = 0,
    c1r2: number = 0,
    c2r2: number = 0,
    c3r2: number = 0,
    c0r3: number = 0,
    c1r3: number = 0,
    c2r3: number = 0,
    c3r3: number = 0
  ) {
    // ※矩阵在内存中按照列主序存储
    this._data[0] = c0r0 != undefined ? c0r0 : 0.0;
    this._data[1] = c0r1 != undefined ? c0r1 : 0.0;
    this._data[2] = c0r2 != undefined ? c0r2 : 0.0;
    this._data[3] = c0r3 != undefined ? c0r3 : 0.0;

    this._data[4] = c1r0 != undefined ? c1r0 : 0.0;
    this._data[5] = c1r1 != undefined ? c1r1 : 0.0;
    this._data[6] = c1r2 != undefined ? c1r2 : 0.0;
    this._data[7] = c1r3 != undefined ? c1r3 : 0.0;

    this._data[8] = c2r0 != undefined ? c2r0 : 0.0;
    this._data[9] = c2r1 != undefined ? c2r1 : 0.0;
    this._data[10] = c2r2 != undefined ? c2r2 : 0.0;
    this._data[11] = c2r3 != undefined ? c2r3 : 0.0;

    this._data[12] = c3r0 != undefined ? c3r0 : 0.0;
    this._data[13] = c3r1 != undefined ? c3r1 : 0.0;
    this._data[14] = c3r2 != undefined ? c3r2 : 0.0;
    this._data[15] = c3r3 != undefined ? c3r3 : 0.0;
  }

  static computeOrthographicOffCenter(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ): Matrix4 {
    let result: Matrix4 = new Matrix4();

    // 缩放比例
    let a = 1.0 / (right - left);
    let b = 1.0 / (top - bottom);
    let c = 1.0 / (far - near);

    // 偏移值
    const tx = -(right + left) * a;
    const ty = -(top + bottom) * b;
    const tz = -(far + near) * c;

    a *= 2.0;
    b *= 2.0;
    c *= 2.0;

    result._data[0] = a;
    result._data[1] = 0.0;
    result._data[2] = 0.0;
    result._data[3] = 0.0;
    result._data[4] = 0.0;
    result._data[5] = b;
    result._data[6] = 0.0;
    result._data[7] = 0.0;
    result._data[8] = 0.0;
    result._data[9] = 0.0;
    result._data[10] = c;
    result._data[11] = 0.0;
    result._data[12] = tx;
    result._data[13] = ty;
    result._data[14] = tz;
    result._data[15] = 1.0;

    return result;
  }

  static computeView(
    position: Cartesian3,
    direction: Cartesian3,
    up: Cartesian3,
    right: Cartesian3
  ): Matrix4 {
    let result: Matrix4 = new Matrix4();

    // ※视图矩阵的z轴与相机朝向相反※
    // ※可以理解为先平移到过渡矩阵（与世界坐标轴对齐），再从过渡矩阵旋转到目标矩阵
    result._data[0] = right.x;
    result._data[1] = up.x;
    result._data[2] = -direction.x;
    result._data[3] = 0.0;
    result._data[4] = right.y;
    result._data[5] = up.y;
    result._data[6] = -direction.y;
    result._data[7] = 0.0;
    result._data[8] = right.z;
    result._data[9] = up.z;
    result._data[10] = -direction.z;
    result._data[11] = 0.0;
    result._data[12] = -right.dot(position);
    result._data[13] = -up.dot(position);
    result._data[14] = direction.dot(position);
    result._data[15] = 1.0;

    return result;
  }

  multiplyByPoint(cartesian: Cartesian3): Cartesian3 {
    let vX = cartesian.x;
    let vY = cartesian.y;
    let vZ = cartesian.z;

    // 矩阵在内存中按照列主序存储
    let x =
      this._data[0] * vX +
      this._data[4] * vY +
      this._data[8] * vZ +
      this._data[12];
    let y =
      this._data[1] * vX +
      this._data[5] * vY +
      this._data[9] * vZ +
      this._data[13];
    let z =
      this._data[2] * vX +
      this._data[6] * vY +
      this._data[10] * vZ +
      this._data[14];

    let result: Cartesian3 = new Cartesian3();
    result.x = x;
    result.y = y;
    result.z = z;

    return result;
  }

  multiply(right: Matrix4): Matrix4 {
    var left0 = this._data[0];
    var left1 = this._data[1];
    var left2 = this._data[2];
    var left3 = this._data[3];
    var left4 = this._data[4];
    var left5 = this._data[5];
    var left6 = this._data[6];
    var left7 = this._data[7];
    var left8 = this._data[8];
    var left9 = this._data[9];
    var left10 = this._data[10];
    var left11 = this._data[11];
    var left12 = this._data[12];
    var left13 = this._data[13];
    var left14 = this._data[14];
    var left15 = this._data[15];

    var right0 = right._data[0];
    var right1 = right._data[1];
    var right2 = right._data[2];
    var right3 = right._data[3];
    var right4 = right._data[4];
    var right5 = right._data[5];
    var right6 = right._data[6];
    var right7 = right._data[7];
    var right8 = right._data[8];
    var right9 = right._data[9];
    var right10 = right._data[10];
    var right11 = right._data[11];
    var right12 = right._data[12];
    var right13 = right._data[13];
    var right14 = right._data[14];
    var right15 = right._data[15];

    var column0Row0 =
      left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
    var column0Row1 =
      left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
    var column0Row2 =
      left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
    var column0Row3 =
      left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;

    var column1Row0 =
      left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
    var column1Row1 =
      left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
    var column1Row2 =
      left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
    var column1Row3 =
      left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;

    var column2Row0 =
      left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
    var column2Row1 =
      left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
    var column2Row2 =
      left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
    var column2Row3 =
      left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;

    var column3Row0 =
      left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
    var column3Row1 =
      left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
    var column3Row2 =
      left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
    var column3Row3 =
      left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;

    let result: Matrix4 = new Matrix4();
    result._data[0] = column0Row0;
    result._data[1] = column0Row1;
    result._data[2] = column0Row2;
    result._data[3] = column0Row3;
    result._data[4] = column1Row0;
    result._data[5] = column1Row1;
    result._data[6] = column1Row2;
    result._data[7] = column1Row3;
    result._data[8] = column2Row0;
    result._data[9] = column2Row1;
    result._data[10] = column2Row2;
    result._data[11] = column2Row3;
    result._data[12] = column3Row0;
    result._data[13] = column3Row1;
    result._data[14] = column3Row2;
    result._data[15] = column3Row3;

    return result;
  }
}

export { Matrix4 };
