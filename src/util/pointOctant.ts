import { Cartesian3 } from "./cartesian3";

const pattern = [
  new Uint8Array([0, 0, 0]),
  new Uint8Array([0, 0, 1]),
  new Uint8Array([0, 1, 0]),
  new Uint8Array([0, 1, 1]),

  new Uint8Array([1, 0, 0]),
  new Uint8Array([1, 0, 1]),
  new Uint8Array([1, 1, 0]),
  new Uint8Array([1, 1, 1]),
];

/**
 *空间八叉树节点
 *
 * @export
 * @class PointOctant
 */
export class PointOctant {
  // 节点包围盒最小值坐标
  private _min: Cartesian3;
  // 节点包围盒最大值坐标
  private _max: Cartesian3;

  // 孩子节点
  private _children: PointOctant[];
  // 节点中的三维点
  private _points: Cartesian3[];
  // 节点中的数据
  private _data: any[];

  /**
   *八叉树根节点
   * @param {Cartesian3} min
   * @param {Cartesian3} max
   * @memberof PointOctant
   */
  constructor(min: Cartesian3, max: Cartesian3) {
    this._min = min;
    this._max = max;

    this._children = [];
    this._points = [];
    this._data = [];
  }

  /**
   *获取八叉树节点中心点坐标
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctant
   */
  get center(): Cartesian3 {
    return this._min.add(this._max).divideByScalar(2);
  }

  /**
   *
   *获取八叉树节点空间维度
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctant
   */
  get dimensions(): Cartesian3 {
    return this._max.subtract(this._min);
  }

  /**
   *节点包围盒最小值
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctant
   */
  get min(): Cartesian3 {
    return this._min;
  }

  /**
   *节点包围盒最小值
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctant
   */
  get max(): Cartesian3 {
    return this._max;
  }

  /**
   *节点的所有孩子节点
   *
   * @readonly
   * @type {PointOctant[]}
   * @memberof PointOctant
   */
  get children(): PointOctant[] {
    return this._children;
  }

  /**
   *节点中的三维点
   *
   * @readonly
   * @type {Cartesian3[]}
   * @memberof PointOctant
   */
  get points(): Cartesian3[] {
    return this._points;
  }

  /**
   *节点中的数据
   *
   * @readonly
   * @type {any[]}
   * @memberof PointOctant
   */
  get data(): any[] {
    return this._data;
  }

  /**
   *
   *给定顶点到节点包围盒表面的空间距离平方
   * @param {Cartesian3} point
   * @returns {number}
   * @memberof PointOctant
   */
  distanceToSquared(point: Cartesian3): number {
    // 求点与包围盒最短距离连线在包围盒表面交点坐标
    let clampPoint = Cartesian3.clamp(point, this._min, this._max);

    // 计算交点与三维点的空间距离
    return clampPoint.subtract(point).magnitudeSquared();
  }

  /**
   *计算三维点到节点中心距离的平方
   *
   * @param {Cartesian3} point
   * @returns {number}
   * @memberof PointOctant
   */
  distanceToCenterSquare(point: Cartesian3): number {
    return this.center.subtract(point).magnitudeSquared();
  }

  /**
   *三维点是否在节点包围盒中
   *
   * @param {Cartesian3} point：待判断的节点
   * @param {number} bias：容差
   * @returns {boolean}
   * @memberof PointOctant
   */
  contains(point: Cartesian3, bias: number): boolean {
    let min = this._min;
    let max = this._max;

    return (
      point.x >= min.x - bias &&
      point.y >= min.y - bias &&
      point.z >= min.z - bias &&
      point.x <= max.x + bias &&
      point.y <= max.y + bias &&
      point.z <= max.z + bias
    );
  }

  /**
   *
   *重新分配节点数据
   * @param {number} bias：容差
   * @memberof PointOctant
   */
  redistribute(bias: number) {
    let children = this._children;
    let points = this._points;
    let data = this._data;

    let i, j, il, jl;
    let child, point, entry;

    if (children.length !== 0 && points.length !== 0) {
      for (i = 0, il = points.length; i < il; ++i) {
        point = points[i];
        entry = data[i];

        for (j = 0, jl = children.length; j < jl; ++j) {
          child = children[j];
          if (child.contains(point, bias)) {
            child._points.push(point);
            child._data.push(entry);
            break;
          }
        }
      }
    }

    this._points = [];
    this._data = [];
  }

  /**
   *挂接子节点，重新把当前的空间切分为8份
   *
   * @memberof PointOctant
   */
  split(): void {
    let min = this._min;
    let max = this._max;
    let mid = this.center;

    let children = this._children;

    let i, combination;
    //此处的8是讲一个空间按照8叉树进一步剖分
    for (i = 0; i < 8; ++i) {
      combination = pattern[i];

      children[i] = new PointOctant(
        new Cartesian3(
          combination[0] === 0 ? min.x : mid.x,
          combination[1] === 0 ? min.y : mid.y,
          combination[2] === 0 ? min.z : mid.z
        ),
        new Cartesian3(
          combination[0] === 0 ? mid.x : max.x,
          combination[1] === 0 ? mid.y : max.y,
          combination[2] === 0 ? mid.z : max.z
        )
      );
    }
  }
}
