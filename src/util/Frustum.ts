import { Matrix4 } from "./matrix4";
export class Frustum {
  left: number;
  _left: number;

  right: number;
  _right: number;

  top: number;
  _top: number;

  bottom: number;
  _bottom: number;

  near: number;
  _near: number;

  far: number;
  _far: number;

  projectionMatrix: Matrix4;

  constructor(options: any = {}) {
    this.left = options.left != undefined ? options.left : -1.0;
    this._left = options.left;

    this.right = options.right != undefined ? options.right : 1.0;
    this._right = options.right;

    this.top = options.top != undefined ? options.top : 1.0;
    this._top = options.top;

    this.bottom = options.bottom != undefined ? options.bottom : -1.0;
    this._bottom = options.bottom;

    this.near = options.near != undefined ? options.near : 1.0;
    this._near = this.near;

    this.far = options.far != undefined ? options.far : 50000000.0;
    this._far = this.far;

    this.projectionMatrix = new Matrix4();
  }
}
