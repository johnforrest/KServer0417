import { PointOctant } from "./pointOctant";
import { Cartesian3 } from "./cartesian3";
import { BoundingSphere } from "./boundingSphere";
import { BoundingBox } from "./boundingBox";

/**
 *
 *递归获取八叉树深度
 * @param {PointOctant} octant
 * @returns {number}
 */
function getDepth(octant: PointOctant): number {
  const children = octant.children;

  let result = 0;
  let i, l, d;

  if (children.length !== 0) {
    for (i = 0, l = children.length; i < l; ++i) {
      d = 1 + getDepth(children[i]);

      if (d > result) {
        result = d;
      }
    }
  }

  return result;
}

/**
 *递归获取八叉树中点数量
 *
 * @param {PointOctant} octant
 * @returns {number}
 */
function countPoints(octant: PointOctant): number {
  const children = octant.children;

  let result = 0;
  let i, l;

  if (children.length !== 0) {
    for (i = 0, l = children.length; i < l; ++i) {
      result += countPoints(children[i]);
    }
  } else if (octant.points !== null) {
    result = octant.points.length;
  }

  return result;
}

/**
 *
 *向八叉树中添加数据
 * @param {Cartesian3} point：插入点
 * @param {*} data：插入的数据
 * @param {PointOctree} octree：空间八叉树队形
 * @param {PointOctant} octant：根节点
 * @param {number} depth：深度
 * @returns {boolean}
 */
function put(
  point: Cartesian3,
  data: any,
  octree: PointOctree,
  octant: PointOctant,
  depth: number
): boolean {
  let children = octant.children;
  let exist = false;
  let done = false;
  let i, l;

  // 节点包围盒是否包含三维点
  if (octant.contains(point, octree.bias)) {
    // 没有子节点，新建子节点继续遍历子节点
    if (children.length === 0) {
      // 该节点中没有顶点
      if (octant.points.length === 0) {
        // 清空数据
        octant.data.length = 0;
        octant.points.length = 0;
      } else {
        for (i = 0, l = octant.points.length; !exist && i < l; ++i) {
          exist = octant.points[i].equals(point);
        }
      }

      if (exist) {
        octant.data[i - 1] = data;
        done = true;
      } else if (
        octant.points.length < octree.maxPoints ||
        depth === octree.maxDepth
      ) {
        //TODO:小于最大节点数，深度等于最大深度
        octant.points.push(point.clone());
        octant.data.push(data);
        ++octree.pointCount;
        done = true;
      } else {
        octant.split();
        octant.redistribute(octree.bias);
        children = octant.children;
      }
    }

    // 有子节点，直接插入子节点
    if (children.length !== 0) {
      ++depth;

      // 从最后一个子节点遍历,直到三维点插入
      for (i = 0, l = children.length; !done && i < l; ++i) {
        done = put(point, data, octree, children[i], depth);
      }
    }
  }

  return done;
}

/**
 *球与盒子碰撞检测
 *
 * @param {BoundingSphere} sphere
 * @param {BoundingBox} box
 * @returns {boolean}
 */
function checkCollision(sphere: BoundingSphere, box: BoundingBox): boolean {
  // get closest point
  var x = Math.max(box.min.x, Math.min(sphere.center.x, box.max.x));
  var y = Math.max(box.min.y, Math.min(sphere.center.y, box.max.y));
  var z = Math.max(box.min.z, Math.min(sphere.center.z, box.max.z));

  // point is in sphere
  var distance = Math.sqrt(
    (x - sphere.center.x) * (x - sphere.center.x) +
      (y - sphere.center.y) * (y - sphere.center.y) +
      (z - sphere.center.z) * (z - sphere.center.z)
  );

  return distance < sphere.radius;
}

/**
 *八叉树碰撞检测，返回与sphere相交的所有节点
 *
 * @param {PointOctant} octant
 * @param {BoundingSphere} sphere
 * @param {PointOctant[]} result
 */
function cull(
  octant: PointOctant,
  sphere: BoundingSphere,
  result: PointOctant[]
) {
  let children = octant.children;

  let i, l;

  let box = new BoundingBox(octant.min, octant.max);

  if (checkCollision(sphere, box)) {
    if (children.length !== 0) {
      for (i = 0, l = children.length; i < l; ++i) {
        cull(children[i], sphere, result);
      }
    } else {
      result.push(octant);
    }
  }
}

/**
 *空间八叉树
 *
 * @export
 * @class PointOctree
 */
export class PointOctree {
  // 八叉树根节点
  private _root: PointOctant;
  // 容差
  private _bias: number;
  // 节点内最大点数量
  private _maxPoints: number;
  // 最大深度
  private _maxDepth: number;
  // 八叉树点总数量
  private _pointCount: number;

  /**
   *通过空间最小值、最大值构建空间八叉树.
   * @param {Cartesian3} min
   * @param {Cartesian3} max
   * @param {number} bias:容差
   * @param {number} maxPoints：最大节点数
   * @param {number} maxDepth：最大深度
   * @memberof PointOctree
   */
  constructor(
    min: Cartesian3,
    max: Cartesian3,
    bias: number,
    maxPoints: number,
    maxDepth: number
  ) {
    this._root = new PointOctant(min, max);
    this._bias = Math.max(0.0, bias);
    this._maxPoints = Math.max(1, Math.round(maxPoints));
    this._maxDepth = Math.max(0, Math.round(maxDepth));
    this._pointCount = 0;
  }

  /**
   *获取八叉树根跟节点的最小坐标
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctree
   */
  get min(): Cartesian3 {
    return this._root.min;
  }

  /**
   *获取八叉树根跟节点的最大坐标
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctree
   */
  get max(): Cartesian3 {
    return this._root.max;
  }

  /**
   *
   *返回八叉树根节点的孩子节点
   * @readonly
   * @type {PointOctant[]}
   * @memberof PointOctree
   */
  get children(): PointOctant[] {
    return this._root.children;
  }

  /**
   *返回八叉树的中心点坐标
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctree
   */
  get center(): Cartesian3 {
    return this._root.center;
  }

  /**
   *返回八叉树的空间维度
   *
   * @readonly
   * @type {Cartesian3}
   * @memberof PointOctree
   */
  get dimensions(): Cartesian3 {
    return this._root.dimensions;
  }

  /**
   *返回八叉树容差
   *
   * @readonly
   * @type {number}
   * @memberof PointOctree
   */
  get bias(): number {
    return this._bias;
  }

  /**
   *返回八叉树节点总数
   *
   * @type {number}
   * @memberof PointOctree
   */
  get pointCount(): number {
    return this._pointCount;
  }

  /**
   *设置八叉树节点总数
   *
   * @memberof PointOctree
   */
  set pointCount(value: number) {
    this._pointCount = value;
  }

  /**
   *
   *返回节点内最大点数量
   * @readonly
   * @type {number}
   * @memberof PointOctree
   */
  get maxPoints(): number {
    return this._maxPoints;
  }

  /**
   *返回八叉树的最大深度
   *
   * @readonly
   * @type {number}
   * @memberof PointOctree
   */
  get maxDepth(): number {
    return this._maxDepth;
  }

  /**
   *获取八叉树深度
   *
   * @returns {number}
   * @memberof PointOctree
   */
  getDepth(): number {
    return getDepth(this._root);
  }

  /**
   *获取点总数量
   *
   * @returns {number}
   * @memberof PointOctree
   */
  countPoints(): number {
    return countPoints(this._root);
  }

  /**
   *
   *插入数据
   * @param {Cartesian3} point：插入点
   * @param {*} data:插入的数据
   * @returns {boolean}:返回是否插入成功
   * @memberof PointOctree
   */
  put(point: Cartesian3, data: any): boolean {
    return put(point, data, this, this._root, 0);
  }

  /**
   *
   *求交
   * @param {BoundingSphere} sphere
   * @returns {PointOctant[]}
   * @memberof PointOctree
   */
  cull(sphere: BoundingSphere): PointOctant[] {
    let result: PointOctant[] = [];

    cull(this._root, sphere, result);

    return result;
  }
}
