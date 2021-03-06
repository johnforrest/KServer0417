import { Cartesian3 } from "./cartesian3";
import { Matrix4 } from "./matrix4";
import { Frustum } from "./Frustum";

class Camera {
  position: Cartesian3;
  private _position: Cartesian3;

  direction: Cartesian3;
  private _direction: Cartesian3;

  up: Cartesian3;
  private _up: Cartesian3;

  right: Cartesian3;
  private _right: Cartesian3;

  private _viewMatrix: Matrix4;

  private _frustum: Frustum;

  constructor(options: any = {}) {
    this.position = new Cartesian3();
    this._position = new Cartesian3();

    this.direction = new Cartesian3();
    this._direction = new Cartesian3();

    this.up = new Cartesian3();
    this._up = new Cartesian3();

    this.right = new Cartesian3();
    this._right = new Cartesian3();

    this._viewMatrix = new Matrix4();

    this._frustum = new Frustum();
  }

  updateViewMatrix(): void {
    this._position = this.position;

    this._direction = this.direction;
    this._up = this.up;
    this._right = this.right;

    this._viewMatrix = Matrix4.computeView(
      this._position,
      this._direction,
      this._up,
      this._right
    );
  }

  updateProjection(): void {
    const frustum = this._frustum;

    frustum._left = frustum.left;
    frustum._right = frustum.right;
    frustum._top = frustum.top;
    frustum._bottom = frustum.bottom;
    frustum._near = frustum.near;
    frustum._far = frustum.far;

    frustum.projectionMatrix = Matrix4.computeOrthographicOffCenter(
      frustum.left,
      frustum.right,
      frustum.bottom,
      frustum.top,
      frustum.near,
      frustum.far
    );
  }

  get viewMatrix(): Matrix4 {
    this.updateViewMatrix();
    return this._viewMatrix;
  }

  get projectionMatrix(): Matrix4 {
    this.updateProjection();
    return this._frustum.projectionMatrix;
  }

  get frustum(): Frustum {
    return this._frustum;
  }
}

export { Camera, Frustum };
