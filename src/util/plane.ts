import { Cartesian3 } from "./cartesian3";

export class Plane {

  // 平面距离原点距离
  private _distance: number;

  // 平面法向量
  private _normal: Cartesian3;

  constructor(normal: Cartesian3, distance: number) {

    this._distance = distance;

    this._normal = normal;

  }

  get distance(): number {

    return this._distance;

  }

  get normal(): Cartesian3 {

    return this._normal;

  }

  // 由法线和一个点构造平面
  static fromPointNormal(point: Cartesian3, normal: Cartesian3): Plane {

    let distance = -normal.dot(point);

    let result = new Plane(normal, distance);

    return result;

  }

  // 判断平面与线段是否相交并返回交点
  lineSegmentIntersectWithPlane(endPoint0: Cartesian3, endPoint1: Cartesian3, result: Cartesian3): boolean {

    const EPSILON6 = 0.000001;

    var difference = endPoint1.subtract(endPoint0);
    
    var normal = this.normal;
    var nDotDiff = normal.dot(difference);

    // check if the segment and plane are parallel
    if (Math.abs(nDotDiff) < EPSILON6) {
        return false;
    }

    var nDotP0 = normal.dot(endPoint0);
    var t = -(this.distance + nDotP0) / nDotDiff;

    // intersection only if t is in [0, 1]
    if (t < 0.0 || t > 1.0) {
        return false;
    }

    // intersection is endPoint0 + t * (endPoint1 - endPoint0)
    let intersection = endPoint0.add(difference.multiplyByScalar(t));
    result.x = intersection.x;
    result.y = intersection.y;
    result.z = intersection.z;
    return true;
}

}