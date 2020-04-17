import { Cartesian3 } from "./cartesian3";

export class BoundingBox {

  private _min: Cartesian3;

  private _max: Cartesian3;

  constructor(min: Cartesian3, max: Cartesian3) {

    this._min = min;

    this._max = max;

  }

  get min(): Cartesian3 {

    return this._min;

  }

  get max(): Cartesian3 {

    return this._max;
    
  }
}