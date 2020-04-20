import { Cartesian3 } from "./cartesian3";

/**
 *构建包围球
 *
 * @export
 * @class BoundingSphere
 */
export class BoundingSphere {
  private _center: Cartesian3;
  private _radius: number;

  constructor(center: Cartesian3, radius: number) {
    this._center = center;
    this._radius = radius;
  }

  get center(): Cartesian3 {
    return this._center;
  }

  get radius(): number {
    return this._radius;
  }
}
