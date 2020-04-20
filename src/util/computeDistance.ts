import { Cartesian3 } from "./cartesian3";

export /**
 *计算两个线段的空间距离
 *
 * @param {Cartesian3} P0
 * @param {Cartesian3} P1
 * @param {Cartesian3} Q0
 * @param {Cartesian3} Q1
 * @returns
 */
const computeSegmentsDistance = (
  P0: Cartesian3,
  P1: Cartesian3,
  Q0: Cartesian3,
  Q1: Cartesian3
) => {
  let sqrDistance,
    s,
    t = 0;
  let closets = [];
  const SMALL_NUM = 0.0000001;

  let u = P1.subtract(P0);
  let v = Q1.subtract(Q0);
  let w = P0.subtract(Q0);

  let a = u.dot(u);
  let b = u.dot(v);
  let c = v.dot(v);
  let d = u.dot(w);
  let e = v.dot(w);
  let D = a * c - b * b;
  let sc,
    sN,
    sD = D;
  let tc,
    tN,
    tD = D;

  if (D < SMALL_NUM) {
    sN = 0.0;
    sD = 1.0;
    tN = e;
    tD = c;
  } else {
    sN = b * e - c * d;
    tN = a * e - b * d;
    if (sN < 0.0) {
      sN = 0.0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }

  if (tN < 0.0) {
    tN = 0.0;
    if (-d < 0.0) {
      sN = 0.0;
    } else if (-d > a) {
      sN = sD;
    } else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;
    if (-d + b < 0.0) {
      sN = 0;
    } else if (-d + b > a) {
      sN = sD;
    } else {
      sN = -d + b;
      sD = a;
    }
  }

  sc = Math.abs(sN) < SMALL_NUM ? 0.0 : sN / sD;
  tc = Math.abs(tN) < SMALL_NUM ? 0.0 : tN / tD;

  s = sc;
  t = tc;

  // closest[0] = (1.0 - sc) * P0 + sc * P1;
  // closest[1] = (1.0 - tc) * Q0 + tc * Q1;
  closets.push(P0.multiplyByScalar(1.0 - sc).add(P1.multiplyByScalar(sc)));
  closets.push(Q0.multiplyByScalar(1.0 - tc).add(Q1.multiplyByScalar(tc)));

  // Vector3<double> diff = closest[0] - closest[1];
  // sqrDistance = Dot(diff, diff);
  let diff = closets[0].subtract(closets[1]);
  sqrDistance = diff.magnitude();

  return {
    s: s,
    t: t,
    sqrDistance: sqrDistance,
    closets: closets,
  };
};

function Clip(denom: number, numer: number, t: any) {
  if (denom > 0) {
    if (numer > denom * t.t1) {
      return false;
    }
    if (numer > denom * t.t0) {
      t.t0 = numer / denom;
    }
    return true;
  } else if (denom < 0) {
    if (numer > denom * t.t0) {
      return false;
    }
    if (numer > denom * t.t1) {
      t.t1 = numer / denom;
    }
    return true;
  } else {
    return numer <= 0;
  }
}

export const DoQuery = (
  segOrigin: Cartesian3,
  segDirection: Cartesian3,
  segExtent: number,
  boxExtent: Cartesian3
): any => {
  let result: any = {
    intersect: false,
    numPoints: 0,
    lineParameter: [],
    points: [],
  };

  _DoQuery(segOrigin, segDirection, segExtent, boxExtent, result);

  let boxCenter = new Cartesian3(0.0, 0.0, 0.0);
  let newSegOrigin = segOrigin.add(boxCenter);
  for (let i = 0; i < result.numPoints; ++i) {
    result.points[i] = newSegOrigin.add(
      segDirection.multiplyByScalar(result.lineParameter[i])
    );
  }
  return result;
};

function __DoQuery(
  lineOrigin: Cartesian3,
  lineDirection: Cartesian3,
  boxExtent: Cartesian3,
  result: any
) {
  // The line t-values are in the interval (-infinity,+infinity).  Clip the
  // line against all six planes of an aligned box in centered form.  The
  // result.numEndpoints is
  //   0, no intersection
  //   1, intersect in a single point (t0 is line parameter of point)
  //   2, intersect in a segment (line parameter interval is [t0,t1])
  let t = { t0: -Number.MAX_VALUE, t1: Number.MAX_VALUE };
  let r0 = Clip(+lineDirection.x, -lineOrigin.x - boxExtent.x, t);
  let r1 = Clip(-lineDirection.x, +lineOrigin.x - boxExtent.x, t);
  let r2 = Clip(+lineDirection.y, -lineOrigin.y - boxExtent.y, t);
  let r3 = Clip(-lineDirection.y, +lineOrigin.y - boxExtent.y, t);
  let r4 = Clip(+lineDirection.z, -lineOrigin.z - boxExtent.z, t);
  let r5 = Clip(-lineDirection.z, +lineOrigin.z - boxExtent.z, t);
  if (r0 && r1 && r2 && r3 && r4 && r5) {
    result.intersect = true;
    if (t.t1 > t.t0) {
      result.numPoints = 2;
      result.lineParameter[0] = t.t0;
      result.lineParameter[1] = t.t1;
    } else {
      result.numPoints = 1;
      result.lineParameter[0] = t.t0;
      result.lineParameter[1] = t.t0; // Used by derived classes.
    }
    return;
  }

  result.intersect = false;
  result.numPoints = 0;
}

function ___DoQuery(interval0: number[], interval1: number[]): any {
  let result: any = {};
  result.firstTime = Number.MAX_VALUE;
  result.lastTime = -Number.MAX_VALUE;
  result.overlap = [];

  if (interval0[1] < interval1[0] || interval0[0] > interval1[1]) {
    result.numIntersections = 0;
    result.overlap[0] = Number.MAX_VALUE;
    result.overlap[1] = -Number.MAX_VALUE;
  } else if (interval0[1] > interval1[0]) {
    if (interval0[0] < interval1[1]) {
      result.numIntersections = 2;
      result.overlap[0] =
        interval0[0] < interval1[0] ? interval1[0] : interval0[0];
      result.overlap[1] =
        interval0[1] > interval1[1] ? interval1[1] : interval0[1];
      if (result.overlap[0] == result.overlap[1]) {
        result.numIntersections = 1;
      }
    } // interval0[0] == interval1[1]
    else {
      result.numIntersections = 1;
      result.overlap[0] = interval0[0];
      result.overlap[1] = result.overlap[0];
    }
  } // interval0[1] == interval1[0]
  else {
    result.numIntersections = 1;
    result.overlap[0] = interval0[1];
    result.overlap[1] = result.overlap[0];
  }

  result.intersect = result.numIntersections > 0;
  return result;
}

// 线段求交
function _DoQuery(
  lineOrigin: Cartesian3,
  lineDirection: Cartesian3,
  segExtent: number,
  boxExtent: Cartesian3,
  result: any
) {
  __DoQuery(lineOrigin, lineDirection, boxExtent, result);

  if (result.intersect) {
    // The line containing the segment intersects the box; the t-interval
    // is [t0,t1].  The segment intersects the box as long as [t0,t1]
    // loverlaps the segment t-interval [-segExtent,+segExtent].

    let interval0 = [result.lineParameter[0], result.lineParameter[1]];

    let interval1 = [-segExtent, segExtent];

    let iiResult = ___DoQuery(interval0, interval1);

    if (iiResult.numIntersections > 0) {
      result.numPoints = iiResult.numIntersections;
      for (let i = 0; i < result.numPoints; ++i) {
        result.lineParameter[i] = iiResult.overlap[i];
      }
    } else {
      result.intersect = false;
      result.numPoints = 0;
    }
  }
}
