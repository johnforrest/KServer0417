export class Cartesian3 {
  public x: number;
  public y: number;
  public z: number;

  //TODO:超图坐标重置了
  static Wgs84RadiiSquared: Cartesian3 = new Cartesian3(
    6378137.0 * 6378137.0,
    6378137.0 * 6378137.0,
    6378137.0 * 6378137.0
  );

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   *向量加法
   *
   * @param {Cartesian3} other
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  add(other: Cartesian3): Cartesian3 {
    let result = new Cartesian3();
    result.x = this.x + other.x;
    result.y = this.y + other.y;
    result.z = this.z + other.z;

    return result;
  }

  // 向量减法
  /**
   *向量减法
   *
   * @param {Cartesian3} other
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  subtract(other: Cartesian3): Cartesian3 {
    let result = new Cartesian3();
    result.x = this.x - other.x;
    result.y = this.y - other.y;
    result.z = this.z - other.z;

    return result;
  }

  /**
   *向量点乘
   *
   * @param {Cartesian3} other
   * @returns {number}
   * @memberof Cartesian3
   */
  dot(other: Cartesian3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   *向量叉乘
   *
   * @param {Cartesian3} other
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  cross(other: Cartesian3): Cartesian3 {
    let result = new Cartesian3();
    let leftX = this.x;
    let leftY = this.y;
    let leftZ = this.z;
    let rightX = other.x;
    let rightY = other.y;
    let rightZ = other.z;

    let x = leftY * rightZ - leftZ * rightY;
    let y = leftZ * rightX - leftX * rightZ;
    let z = leftX * rightY - leftY * rightX;

    result.x = x;
    result.y = y;
    result.z = z;

    return result;
  }

  /**
   *
   *向量乘标量
   * @param {number} scalar
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  multiplyByScalar(scalar: number): Cartesian3 {
    let result = new Cartesian3();
    result.x = this.x * scalar;
    result.y = this.y * scalar;
    result.z = this.z * scalar;

    return result;
  }

  /**
   *
   *向量除标量
   * @param {number} scalar
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  divideByScalar(scalar: number): Cartesian3 {
    let result = new Cartesian3();
    result.x = this.x / scalar;
    result.y = this.y / scalar;
    result.z = this.z / scalar;

    return result;
  }

  /**
   *向量对应元素相乘
   *
   * @param {Cartesian3} other
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  multiplyComponents(other: Cartesian3): Cartesian3 {
    let result = new Cartesian3();
    result.x = this.x * other.x;
    result.y = this.y * other.y;
    result.z = this.z * other.z;
    return result;
  }

  /**
   *向量归一化
   *
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  normalize(): Cartesian3 {
    let result = new Cartesian3();
    var magnitude = this.magnitude();

    result.x = this.x / magnitude;
    result.y = this.y / magnitude;
    result.z = this.z / magnitude;

    return result;
  }

  /**
   * 向量模
   *
   * @returns {number}
   * @memberof Cartesian3
   */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   *向量长度
   *
   * @returns {number}
   * @memberof Cartesian3
   */
  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  /**
   *由经纬度弧度值转笛卡尔
   *
   * @static
   * @param {number} longitude
   * @param {number} latitude
   * @param {number} height
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  static fromRadians(
    longitude: number,
    latitude: number,
    height: number
  ): Cartesian3 {
    let scratchK: Cartesian3 = new Cartesian3();
    let scratchN: Cartesian3 = new Cartesian3();

    let cosLatitude: number = Math.cos(latitude);
    scratchN.x = cosLatitude * Math.cos(longitude);
    scratchN.y = cosLatitude * Math.sin(longitude);
    scratchN.z = Math.sin(latitude);
    scratchN = scratchN.normalize();

    scratchK = Cartesian3.Wgs84RadiiSquared.multiplyComponents(scratchN);
    let gamma: number = Math.sqrt(scratchN.dot(scratchK));
    scratchK = scratchK.divideByScalar(gamma);
    scratchN = scratchN.multiplyByScalar(height);

    let result: Cartesian3 = scratchK.add(scratchN);
    return result;
  }

  /**
   *由经纬度值转笛卡尔
   *
   * @static
   * @param {number} longitude
   * @param {number} latitude
   * @param {number} height
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  static fromDegrees(
    longitude: number,
    latitude: number,
    height: number
  ): Cartesian3 {
    let lon: number = longitude * (Math.PI / 180.0);
    let lat: number = latitude * (Math.PI / 180.0);

    let result: Cartesian3 = Cartesian3.fromRadians(lon, lat, height);
    return result;
  }

  /**
   *
   *拷贝向量内容
   * @param {Cartesian3} other
   * @memberof Cartesian3
   */
  copy(other: Cartesian3): void {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
  }

  /**
   *克隆出一个新对象
   *
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  clone(): Cartesian3 {
    return new Cartesian3(this.x, this.y, this.z);
  }

  /**
   *判断向量是否相等
   *
   * @param {Cartesian3} other
   * @returns {boolean}
   * @memberof Cartesian3
   */
  equals(other: Cartesian3): boolean {
    return other.x === this.x && other.y === this.y && other.z === this.z;
  }

  /**
   *向量夹闭函数
   *
   * @static
   * @param {Cartesian3} point
   * @param {Cartesian3} min
   * @param {Cartesian3} max
   * @returns {Cartesian3}
   * @memberof Cartesian3
   */
  static clamp(
    point: Cartesian3,
    min: Cartesian3,
    max: Cartesian3
  ): Cartesian3 {
    let result = new Cartesian3();
    result.x = Math.max(min.x, Math.min(max.x, point.x));
    result.y = Math.max(min.y, Math.min(max.y, point.y));
    result.z = Math.max(min.z, Math.min(max.z, point.z));
    return result;
  }
}
