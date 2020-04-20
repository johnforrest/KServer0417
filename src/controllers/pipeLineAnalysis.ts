import { Request, Response } from "express";
import fs from "fs";
import path from "path";
// 管线数据对象
import { PipeLine } from "../models/PipeLine";
import { DataSource } from "../models/Datasource";
// 包围求
import { BoundingSphere } from "../util/boundingSphere";
import { BoundingBox } from "../util/boundingBox";
// 笛卡尔坐标
import { Cartesian3 } from "../util/cartesian3";
// 矩阵类
import { Matrix4 } from "../util/matrix4";
// 计算距离工具
import { computeSegmentsDistance, DoQuery } from "../util/computeDistance";
// 三维平面
import { Plane } from "../util/plane";
// 连通图
import { Graph } from "../util/graph";
// 导入相机用于断面分析
import { Camera, Frustum } from "../util/camera";

let pipeLine = new PipeLine();
let pipeGraph = new Graph();
// PLID==>edge
let pipeLinesInfo: any = {};

/**
 *读取管线数据源
 *
 * @param {string} configPath
 * @returns {any[]}
 */
function openDataSources(configPath: string): any[] {
  let result: any[] = [];
  let fileList: any[] = [];
  //TODO:判断D:/config.json是否存在
  fs.exists(configPath, function (exist) {
    console.log(exist ? `${configPath}存在` : `${configPath}不存在`);
  });
  let configStr = fs.readFileSync(configPath).toString();
  fileList = JSON.parse(configStr);

  //最终只需要fileList这一个即可
  fileList.forEach((file) => {
    let absolutePath = file.jsonpath;
    let info = fs.statSync(absolutePath);
    let extension = path.parse(absolutePath).ext;
    if (info.isFile() && ".json" === extension) {
      let promise = new Promise((resolve, reject) => {
        let dataSource = new DataSource();
        dataSource.readData(absolutePath, file.piBatch, (dataSource) => {
          // 构建空间索引
          dataSource.buildSpatialIndex();
          // 构建连通图
          dataSource.buildConnectGraph();

          pipeLine.addDataSource(dataSource);

          resolve(dataSource);
        });
      });

      result.push(promise);
    }
  });

  return result;
}

/**
 *
 *配置混接管线（遍历数据源中的所有图，并将其合并）
 * @param {DataSource[]} dataSources
 */
function buildConnectGraphs(dataSources: DataSource[]) {
  // 添加管点
  for (let dataSource of dataSources) {
    let netWorks = dataSource.netWorks;
    for (let netWorkName in netWorks) {
      let netWork = netWorks[netWorkName];

      let edges = netWork.Edges;
      // smid-->nodeInfo, 存储管点信息到连通图
      let nodes = netWork.Nodes;
      let nodesMap: any = {};
      for (let i = 0; i < nodes.length; i++) {
        let SmID = nodes[i].SmID;
        nodesMap[SmID] = nodes[i];
      }

      for (let edge of edges) {
        let PLPT0 = edge.PLPT0;
        let PLPT1 = edge.PLPT1;

        let SmFid = edge.SMFNode;
        let SmTid = edge.SMTNode;
        // 获取起点与终点管点信息
        let fNodeInfo = nodesMap[SmFid];
        let tNodeInfo = nodesMap[SmTid];

        if (fNodeInfo == null || tNodeInfo == null) {
          console.log("stop");
        }

        pipeGraph.addVertex(PLPT0, fNodeInfo);
        pipeGraph.addVertex(PLPT1, tNodeInfo);
      }
    }
  }

  // 添加管线
  for (let dataSource of dataSources) {
    let netWorks = dataSource.netWorks;
    for (let netWorkName in netWorks) {
      let netWork = netWorks[netWorkName];
      let edges = netWork.Edges;

      for (let edge of edges) {
        let PLPT0 = edge.PLPT0;
        let PLPT1 = edge.PLPT1;

        pipeGraph.addEdge(PLPT0, PLPT1, edge);

        // 存储管线信息,用于连通查询根据管线ID查询
        let PLID = edge.PLID;
        pipeLinesInfo[PLID] = edge;
      }
    }
  }

  console.log("连通图构建完毕!");
  console.log("可以发送请求了!");
}

// 根据PIBATCH、数据集名称、smid查找管线
function findPipeLine(piBatch: string, type: string, smid: string): any {
  let line;
  // 查找对应数据源
  let dataSource: DataSource = pipeLine.getDataSource(piBatch);
  let netWorks: any = dataSource.netWorks;

  // 查找对应数据集
  if (netWorks.hasOwnProperty(type)) {
    let netWork = netWorks[type];
    let edges = netWork.Edges;
    // 查找smid对应的管线
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].SmID === Number(smid)) {
        line = edges[i];
      }
    }
  }

  return line;
}

// 根据PIBATCH、type查找数据集
function findPipeNetWork(piBatch: string, type: string): any {
  // 查找对应数据源
  let dataSource: DataSource = pipeLine.getDataSource(piBatch);
  let netWorks: any = dataSource.netWorks;

  let netWork: any;
  if (netWorks.hasOwnProperty(type)) {
    netWork = netWorks[type];
  }

  return netWork;
}

export /**
 *上传数据到Data文件中
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
const uploadFile = (req: any, res: any) => {
  // debugger;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  let file = req.files.file;

  file.mv(`${__dirname}/../data/${file.name}`, function (err: any) {
    if (err) return res.status(500).send(err);

    res.send("File uploaded!");
  });
};

export /**
 *获取data目录文件中的文件列表
 *
 * @param {Request} req
 * @param {Response} res
 */
const fileList = (req: Request, res: Response) => {
  // debugger;
  let result: any = [];
  let url = `${__dirname}/../data/`;
  var fileList = fs.readdirSync(url);
  fileList.forEach((file, index) => {
    let absolutePath = url + file;
    let info = fs.statSync(absolutePath);
    let extension = path.parse(absolutePath).ext;
    if (info.isFile() && ".json" === extension) {
      result.push(file);
    }
  });

  // 返回文件列表
  res.json(result);
};

// 获取服务配置文件config.json
export /**
 *获取服务配置文件config.json
 *
 * @param {Request} req
 * @param {Response} res
 */
const configFile = (req: Request, res: Response) => {
  // debugger;

  let congfigFilePath = `${__dirname}/../config.json`;
  let configString = fs.readFileSync(congfigFilePath).toString();
  let configJson = JSON.parse(configString);
  // 返回服务列表
  res.json(configJson);
};

export /**
 *
 *更新服务配置文件config.json
 * @param {Request} req
 * @param {Response} res
 */
const updateConfigFile = (req: Request, res: Response) => {
  // debugger;
  const query = req.query;
  const data = query.data;
  let configArray: any = [];
  for (let i = 0; i < data.length; ++i) {
    configArray.push(JSON.parse(data[i]));
  }

  let congfigFilePath = `${__dirname}/../config.json`;
  let congfigStr = JSON.stringify({ pipeLine: configArray });
  fs.writeFileSync(congfigFilePath, congfigStr);

  // 服务列表跟新成功
  res.json("update config success");
};

export /**
 *重新读取管线数据
 *
 * @param {Request} req
 * @param {Response} res
 */
const startServer = (req: Request, res: Response) => {
  // 置空全局对象
  pipeLine = new PipeLine();
  pipeGraph = new Graph();
  pipeLinesInfo = {};

  // 重新读取json数据，构建管线数据结构
  // let congfigFilePath = `${__dirname}/../config.json`;
  let congfigFilePath = `D:/config.json`;
  let promises = openDataSources(congfigFilePath);

  Promise.all(promises).then(function (values) {
    // 构建连通图
    buildConnectGraphs(values);
    res.json({
      state: "OK",
    });
  });
};

export /**
 *
 *净距分析
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const distanceAnalysis = (req: Request, res: Response) => {
  const query = req.query;

  // 管线所在数据源
  let pibatch0 = query.PIBATCH0;
  // 管线所属类型(☞管线在数据源中数据集的名称)
  let type0 = query.TYPE0;
  // 管线SMID(☞管线在数据集中的id值)
  let smid0 = query.SMID0;

  let pibatch1 = query.PIBATCH1;
  let type1 = query.TYPE1;
  let smid1 = query.SMID1;

  // 根据PIBATCH、TYPE、SMID查询管线信息
  let line0 = findPipeLine(pibatch0, type0, smid0);
  let line1 = findPipeLine(pibatch1, type1, smid1);

  // 计算line0、line1的距离
  // 获取管线line0的管点坐标，并转换为笛卡尔坐标
  let p0, p1, q0, q1;
  p0 = Cartesian3.fromDegrees(
    line0.Points[0].x,
    line0.Points[0].y,
    line0.Points[0].z
  );
  p1 = Cartesian3.fromDegrees(
    line0.Points[1].x,
    line0.Points[1].y,
    line0.Points[1].z
  );

  // 获取管线line1的管点坐标，并转换为笛卡尔坐标
  q0 = Cartesian3.fromDegrees(
    line1.Points[0].x,
    line1.Points[0].y,
    line1.Points[0].z
  );
  q1 = Cartesian3.fromDegrees(
    line1.Points[1].x,
    line1.Points[1].y,
    line1.Points[1].z
  );

  // 计算两根管线的空间最短距离
  let obj = computeSegmentsDistance(p0, p1, q0, q1);
  Object.assign(obj, { line0, line1 });

  let result = [];
  result.push(obj);
  return res.json(result);
};

export /**
 *碰撞分析
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const collisionAnalysis = (req: Request, res: Response) => {
  const query = req.query;

  // 管线所在数据源
  let pibatch0 = query.PIBATCH0;
  // 管线所属类型(☞管线在数据源中数据集的名称)
  let type0 = query.TYPE0;

  let pibatch1 = query.PIBATCH1;
  let type1 = query.TYPE1;

  // 碰撞分析阈值
  let minDistance = Number(query.MINDISTANCE);

  // 查询需要分析的数据集
  let pipeNetWork0 = findPipeNetWork(pibatch0, type0);
  let pipeNetWork1 = findPipeNetWork(pibatch1, type1);

  let edges0 = pipeNetWork0.Edges;
  let octree1 = pipeNetWork1.Octree;

  // 返回结果数组
  let result: any = {};
  for (let i = 0; i < edges0.length; i++) {
    // 构建edge0包围球
    let edge0 = edges0[i];
    var p0 = Cartesian3.fromDegrees(
      edge0.Points[0].x,
      edge0.Points[0].y,
      edge0.Points[0].z
    );
    var p1 = Cartesian3.fromDegrees(
      edge0.Points[1].x,
      edge0.Points[1].y,
      edge0.Points[1].z
    );
    var mid = p0.add(p1).divideByScalar(2);
    // 包围求半径扩大些，以防漏掉一些相交的节点
    var radius = 2 * p0.subtract(p1).magnitude();
    let boundingSphere = new BoundingSphere(mid, radius);

    // 计算相交的节点，八叉树快速剔除
    let octants = octree1.cull(boundingSphere);
    // 遍历相交节点，并取出数据插入到返回值中
    for (let j = 0; j < octants.length; j++) {
      let data = octants[j].data;
      if (data.length === 0) {
        continue;
      }

      for (let k = 0; k < data.length; k++) {
        let edge1 = data[k];
        let q0 = Cartesian3.fromDegrees(
          edge1.Points[0].x,
          edge1.Points[0].y,
          edge1.Points[0].z
        );
        let q1 = Cartesian3.fromDegrees(
          edge1.Points[1].x,
          edge1.Points[1].y,
          edge1.Points[1].z
        );
        // 计算edge0与edge1之间距离
        let obj = computeSegmentsDistance(p0, p1, q0, q1);
        // 是否小于碰撞阈值
        if (obj.sqrDistance < minDistance) {
          // 分析结果是edge0为键值，距离和edge1为值的对象
          if (!result.hasOwnProperty(edge0.SmID)) {
            result[edge0.SmID] = new Array();
          }

          let o = {
            sqrDistance: obj.sqrDistance,
            closets: obj.closets,
            edge0: edge0,
            edge1: edge1,
          };
          result[edge0.SmID].push(o);
        }
      }
    }
  }

  return res.json(result);
};

export /**
 *横断面分析
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const horizontalProfileAnalysis = (req: Request, res: Response) => {
  const query = req.query;

  // 三点构成一个平面
  let point0 = query.POINT0;
  let point1 = query.POINT1;
  let point2 = query.POINT2;

  // 转成笛卡尔坐标
  let firstPoint = new Cartesian3(
    Number(point0[0]),
    Number(point0[1]),
    Number(point0[2])
  );
  let secondPoint = new Cartesian3(
    Number(point1[0]),
    Number(point1[1]),
    Number(point1[2])
  );
  let thirdPoint = new Cartesian3(
    Number(point2[0]),
    Number(point2[1]),
    Number(point2[2])
  );

  // 构造三维平面
  let p10 = secondPoint.subtract(firstPoint);
  let p20 = thirdPoint.subtract(firstPoint);
  let normal = p20.cross(p10).normalize();
  let plane = Plane.fromPointNormal(firstPoint, normal);
  // 稍微扩大包围盒
  let length = p10.magnitude() * 2;
  let boundingSphere = new BoundingSphere(
    firstPoint.add(secondPoint).divideByScalar(2),
    length
  );

  let result = {
    intersection: new Array(),
  };
  const dataSources = pipeLine.getAllDataSources();
  for (const dataSourceName in dataSources) {
    const dataSource = dataSources[dataSourceName];
    const netWorks = dataSource.netWorks;
    for (const netWorkName in netWorks) {
      // 数据集的空间索引
      const octree = netWorks[netWorkName].Octree;

      // 计算相交的节点，八叉树快速剔除
      let octants = octree.cull(boundingSphere);
      // 遍历相交节点，并取出数据插入到返回值中
      for (let j = 0; j < octants.length; j++) {
        let data = octants[j].data;
        if (data.length === 0) {
          continue;
        }

        // 遍历节点中的管线
        for (let k = 0; k < data.length; k++) {
          let edge = data[k];
          let p0 = Cartesian3.fromDegrees(
            edge.Points[0].x,
            edge.Points[0].y,
            edge.Points[0].z
          );
          let p1 = Cartesian3.fromDegrees(
            edge.Points[1].x,
            edge.Points[1].y,
            edge.Points[1].z
          );

          let intersectionPoint = new Cartesian3();
          let isIntersection = plane.lineSegmentIntersectWithPlane(
            p0,
            p1,
            intersectionPoint
          );
          if (isIntersection) {
            // 将交点及管线信息返回到结果数组中
            let o = {
              position: intersectionPoint,
              edge: edge,
            };
            result.intersection.push(o);
          }
        }
      }
    }
  }

  // 返回结果数据
  return res.json(result);
};

// 判断点是否落在正交视锥体内
function IsInBox(
  p0: Cartesian3,
  width: number,
  height: number,
  length: number
): boolean {
  return (
    p0.x > -width &&
    p0.x < width &&
    p0.y > -height &&
    p0.y < height &&
    p0.z > -length &&
    p0.z < length
  );
}

/**
 *
 *查询线段与box的交点
 * @param {Cartesian3} p0
 * @param {Cartesian3} p1
 * @param {BoundingBox} box
 * @returns {*}
 */
function FindIntersection(
  p0: Cartesian3,
  p1: Cartesian3,
  box: BoundingBox
): any {
  let segOrigin = p0.add(p1).divideByScalar(2);
  let segDirection = p1.subtract(p0).normalize();
  let segExtent = p1.subtract(p0).magnitude() * 0.5;
  let boxExtent = new Cartesian3(box.max.x, box.max.y, box.max.z);

  // 相交查询
  let result = DoQuery(segOrigin, segDirection, segExtent, boxExtent);

  return result;
}

export /**
 *纵断面分析
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const verticalProfileAnalysis = (req: Request, res: Response) => {
  // 输入参数
  const query = req.query;

  // 断面分析的两个端点
  let p0 = query.POINT0;
  let p1 = query.POINT1;
  // 距离断面垂直距离distance范围内的管线才会参与正交投影;
  var distance = query.distance !== undefined ? query.distance : 50;
  var firstPoint = new Cartesian3(Number(p0[0]), Number(p0[1]), Number(p0[2]));
  var secondPoint = new Cartesian3(Number(p1[0]), Number(p1[1]), Number(p1[2]));
  // 计算正交相机的x轴长度
  var xlength = secondPoint.subtract(firstPoint).magnitude();

  // 相机中心位置
  var position = firstPoint.add(secondPoint).multiplyByScalar(0.5);
  // 相机朝向与视图矩阵Z方向相反
  var right = secondPoint.subtract(firstPoint);
  right = right.normalize();
  var up = position.normalize();
  var direction = up.cross(right);
  direction = direction.normalize();
  up = right.cross(direction);
  up = up.normalize();

  let camera = new Camera();
  // 保持和前端一致的模型矩阵（这里将相机视图矩阵当成模型矩阵），一开始想用相机投影来做，后来发现计算一个局部模型矩阵就可以了。
  camera.position = position;
  camera.direction = new Cartesian3(-up.x, -up.y, -up.z);
  camera.up = direction;
  camera.right = right;

  // 获取视图矩阵
  var viewMatrix = camera.viewMatrix;

  let result: any = [];
  // 遍历管线
  const dataSources = pipeLine.getAllDataSources();
  // 以相机为中心点，10倍用户分析半径范围的包围球
  let boundingSphere = new BoundingSphere(position, xlength * 5.0);
  let boundingBox = new BoundingBox(
    new Cartesian3(-xlength / 2, -50, -distance),
    new Cartesian3(xlength / 2, 50, distance)
  );
  for (const dataSourceName in dataSources) {
    const dataSource = dataSources[dataSourceName];
    const netWorks = dataSource.netWorks;
    for (const netWorkName in netWorks) {
      // 数据集的空间索引
      const octree = netWorks[netWorkName].Octree;

      // 数据集的节点信息，返回时需要根据该数据集中管线中管点SMNodeId查找管点对象
      const nodesMap = netWorks[netWorkName].Nodes;

      // 计算相交的节点，八叉树快速剔除
      let octants = octree.cull(boundingSphere);
      // 遍历相交节点，并取出数据插入到返回值中
      for (let j = 0; j < octants.length; j++) {
        let data = octants[j].data;
        if (data.length === 0) {
          continue;
        }

        // 遍历节点中的管线
        for (let k = 0; k < data.length; k++) {
          let edge = data[k];
          let edgeP0 = Cartesian3.fromDegrees(
            edge.Points[0].x,
            edge.Points[0].y,
            edge.Points[0].z
          );
          let edgeP1 = Cartesian3.fromDegrees(
            edge.Points[1].x,
            edge.Points[1].y,
            edge.Points[1].z
          );

          // 管线与box求交
          // 1、将线段转换到boundingBox的坐标系下
          let p0InBoxCoords = viewMatrix.multiplyByPoint(edgeP0);
          let p1InBoxCoords = viewMatrix.multiplyByPoint(edgeP1);

          let pipeLineInProfileInfo: any = {};
          // 2、判断管线是否完全在AABoundingBox中
          if (
            IsInBox(p0InBoxCoords, xlength / 2.0, 50.0, distance) &&
            IsInBox(p1InBoxCoords, xlength / 2.0, 50.0, distance)
          ) {
            pipeLineInProfileInfo.positionInProfile = [
              p0InBoxCoords,
              p1InBoxCoords,
            ];

            // 查询管点信息
            let fNodeInfo = nodesMap[edge.Info.SMFNode - 1];
            let tNodeInfo = nodesMap[edge.Info.SMTNode - 1];
            // 添加管点编号信息
            fNodeInfo.PLPTNO = edge.Info.PLPT0;
            tNodeInfo.PLPTNO = edge.Info.PLPT1;
            pipeLineInProfileInfo.pipeNodeInfo = [fNodeInfo, tNodeInfo];

            // 查询管线信息
            let info: any = {};
            Object.assign(info, edge);
            pipeLineInProfileInfo.pipeLineInfo = info;

            result.push(pipeLineInProfileInfo);
          } else {
            // 查询管线与AABoundingBox的交点
            let tempResult = FindIntersection(
              p0InBoxCoords,
              p1InBoxCoords,
              boundingBox
            );
            if (tempResult.intersect) {
              // 相交将交点存入结果数据
              //pipeLineInProfileInfo.positionInProfile = [p0InBoxCoords, p1InBoxCoords];
              // 数组去除重复点
              // for (let i = 0; i < tempResult.points.length; i++) {
              //   // 判断点坐标是否重合
              //   if (!tempResult.points[i].equals(p0InBoxCoords) && !tempResult.points[i].equals(p1InBoxCoords)) {
              //     pipeLineInProfileInfo.positionInProfile.push(tempResult.points[i]);
              //   }
              // }
              // 只返回交点和内部点
              pipeLineInProfileInfo.positionInProfile = tempResult.points;

              // 查询管点信息
              let fNodeInfo = nodesMap[edge.Info.SMFNode - 1];
              let tNodeInfo = nodesMap[edge.Info.SMTNode - 1];
              // 添加管点编号信息
              fNodeInfo.PLPTNO = edge.Info.PLPT0;
              tNodeInfo.PLPTNO = edge.Info.PLPT1;
              pipeLineInProfileInfo.pipeNodeInfo = [fNodeInfo, tNodeInfo];

              let info: any = {};
              Object.assign(info, edge);
              pipeLineInProfileInfo.pipeLineInfo = info;

              result.push(pipeLineInProfileInfo);
            }
          }
        }
      }
    }
  }

  // 返回结果数据
  return res.json({ result, xlength });
};

export /**
 *输入PLPT管点查询管点的上下游信息
 *测站区域分析
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const searchNodesByPLPT = (req: Request, res: Response) => {
  const query = req.query;
  // debugger;
  // 输入管点的PLPT编号进行查询
  const pipeLineNode = query.PIPENODE;

  // 正向查询获取下游信息
  let downstream = pipeGraph.dfs(pipeLineNode);
  // 逆向查询获取上游信息
  let upstream = pipeGraph.dfsInv(pipeLineNode);

  // 使用测试数据进行测试
  // let testGraph = createTestGraph();
  // let downstream = testGraph.dfs(pipeLineNode);
  // let upstream = testGraph.dfsInv(pipeLineNode);

  return res.json({ upstream, downstream });
};
export /**
 *输入PLPT管点查询管点的上下游信息
 *测站区域分析
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const searchNodesByPLPTPost = (req: Request, res: Response) => {
  //判断是否是是数组
  if (req.body.PIPENODE != null) {
    let pipeNode = req.body.PIPENODE.toString();
    let array = pipeNode.split(",");
    let resultArr: Array<object> = new Array<object>();
    if (array.length == 0) {
      return null;
    }
    for (let index = 0; index < array.length; index++) {
      const pipeLineNode = array[index];
      // 正向查询获取下游信息
      let downstream = pipeGraph.dfs(pipeLineNode);
      // 逆向查询获取上游信息
      let upstream = pipeGraph.dfsInv(pipeLineNode);
      resultArr.push({
        upstream,
        downstream,
      });
    }
    return res.json(resultArr);
  }
};
export /**
 *输入PLPT管点查询管点的上下游信息
 *测站区域分析
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const searchNodesByPLPTPostUp = (req: Request, res: Response) => {
  //判断是否是是数组
  if (req.body.PIPENODE != null) {
    let pipeNode = req.body.PIPENODE.toString();
    let array = pipeNode.split(",");
    let resultArr: Array<object> = new Array<object>();
    if (array.length == 0) {
      return null;
    }
    for (let index = 0; index < array.length; index++) {
      const pipeLineNode = array[index];
      // 正向查询获取下游信息
      // let downstream = pipeGraph.dfs(pipeLineNode);
      // 逆向查询获取上游信息
      let upstream = pipeGraph.dfsInv(pipeLineNode);
      resultArr.push({
        upstream,
      });
    }
    return res.json(resultArr);
  }
};
export /**
 *输入PLPT管点查询管点的上下游信息
 *测站区域分析
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const searchNodesByPLPTPostDown = (req: Request, res: Response) => {
  //判断是否是是数组
  if (req.body.PIPENODE != null) {
    let pipeNode = req.body.PIPENODE.toString();
    let array = pipeNode.split(",");
    let resultArr: Array<object> = new Array<object>();
    if (array.length == 0) {
      return null;
    }
    for (let index = 0; index < array.length; index++) {
      const pipeLineNode = array[index];
      // 正向查询获取下游信息
      let downstream = pipeGraph.dfs(pipeLineNode);
      // 逆向查询获取上游信息
      //   let upstream = pipeGraph.dfsInv(pipeLineNode);
      resultArr.push({
        downstream,
      });
    }
    return res.json(resultArr);
  }
};
export /**
 *爆管分析
 *输入PLID查询管线的上下游信息
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const searchNodesByPLID = (req: Request, res: Response) => {
  const query = req.query;
  const PLID = query.PIPELINE;

  // 获取管线信息
  let edge = pipeLinesInfo[PLID];
  let PLPT0 = edge.PLPT0;
  let PLPT1 = edge.PLPT1;

  // 查询起点的上游管线
  let upstream = pipeGraph.dfsInv(PLPT0);
  // 查询终点的下游管线
  let downstream = pipeGraph.dfs(PLPT1);

  return res.json({ upstream, downstream });
};

export /**
 *
 *连通性分析，输入两个管线，返回两根管线之间的最短路径
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const connected = (req: Request, res: Response) => {
  const query = req.query;
  const PLID0 = query.PIPELINE0;
  const PLID1 = query.PIPELINE1;

  // 获取管线信息
  let edge0 = pipeLinesInfo[PLID0];
  let edge1 = pipeLinesInfo[PLID1];
  let edge0_PLPT0 = edge0.PLPT0;
  let edge0_PLPT1 = edge0.PLPT1;
  let edge1_PLPT0 = edge1.PLPT0;
  let edge1_PLPT1 = edge1.PLPT1;

  // edge0在上游，edge1在下游
  let start = edge0_PLPT1;
  let end = edge1_PLPT0;
  let result = pipeGraph.dikstra(edge0_PLPT1, edge1_PLPT0);
  if (result.connected == false) {
    (start = edge1_PLPT1), (end = edge0_PLPT0);
    result = pipeGraph.dikstra(edge1_PLPT1, edge0_PLPT0);
  }

  if (start == end) {
    let path: any = [];
    return res.json({ connected: true, path });
  }

  // 重新调整返回值
  if (result.connected == true) {
    let v = result.previousVertex[end];
    let path: any = [];
    while (v != "null") {
      path.push(v);
      v = result.previousVertex[v];
    }
    path.reverse();
    path.push(end);

    let nodesInfo: any = [];
    let edgesInfo: any = [];
    // 获取节点信息
    for (let i = 0; i < path.length; i++) {
      let info = pipeGraph.vertexInfo[path[i]];
      let nodeInfo: any = {};
      Object.assign(nodeInfo, info);
      // 填充PLPTNO信息
      nodeInfo.PLPTNO = path[i];
      nodesInfo.push(nodeInfo);
    }
    // 获取边信息
    for (let i = 0; i < path.length - 1; i++) {
      let p0 = path[i];
      let p1 = path[i + 1];
      let edgeInfo = pipeGraph.adjacencyMapEdgeInfo[p0][p1];
      edgesInfo.push(edgeInfo);
    }

    result = { connected: true, path, nodesInfo, edgesInfo };
  } else {
    result = { connected: false, path: [] };
  }

  return res.json(result);
};

export /**
 *获取测试连通图
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const getTestGraph = (req: Request, res: Response) => {
  let testGraph = new Graph();

  testGraph.addVertex("0", 0);
  testGraph.addVertex("1", 0);
  testGraph.addVertex("2", 0);
  testGraph.addVertex("3", 0);
  testGraph.addVertex("4", 0);
  testGraph.addVertex("5", 0);
  testGraph.addVertex("6", 0);

  testGraph.addEdge("0", "1", { SMLength: 1 });
  testGraph.addEdge("1", "3", { SMLength: 1 });
  testGraph.addEdge("3", "4", { SMLength: 2 });
  testGraph.addEdge("4", "5", { SMLength: 1 });
  testGraph.addEdge("1", "2", { SMLength: 2 });
  testGraph.addEdge("2", "5", { SMLength: 5 });
  testGraph.addEdge("2", "6", { SMLength: 1 });

  let result = testGraph.dikstra("0", "5");

  return res.json(result);
};
