import * as fs from "fs";
import * as path from "path";
import { Cartesian3 } from "../util/cartesian3";
import { PointOctree } from "../util/pointOctree";
import { Graph } from "../util/graph";
//
/**
 *函数接口，函数名称为CallBack，函数参数为obj，类型为任意类型，函数返回值为void类型
 *
 * @interface Callback
 */
interface Callback {
  (obj: any): void;
}

export class DataSource {
  // 数据源名称
  private _name: string = "";
  // 数据路径
  private _url: string = "";
  // 数据batchid
  private _piBatch: string = "";
  // 解析后的管网
  private _pipeNetWorks: { [key: string]: any } = {};

  private pipeGraph: Graph = new Graph();

  //TODO：声明 PLID==>edge
  // private pipeLinesInfo: any = {};
  private pipeLinesInfo: any = {};

  get piBatch(): string {
    return this._piBatch;
  }

  get netWorks(): any {
    return this._pipeNetWorks;
  }

  get name(): string {
    return this._name;
  }

  get url(): string {
    return this._url;
  }

  get getPipeGraph(): Graph {
    return this.pipeGraph;
  }

  get getPipeLinesInfo(): any {
    return this.pipeLinesInfo;
  }

  constructor() {}

  //
  /**
   *解析数据源
   *
   * @param {string} url
   * @param {string} batchId
   * @param {Callback} [handler=(obj: any) => {}]
   * @memberof DataSource
   */
  readData(url: string, batchId: string, handler: Callback = (obj: any) => {}) {
    fs.readFile(url, "utf-8", (err, data) => {
      if (err) {
        return console.error(err);
      }

      this._pipeNetWorks = JSON.parse(data).PipeNetWorks;
      this._url = url;
      this._name = url;
      this._piBatch = batchId;

      console.log("read dataSource successfully from: " + url);
      //   console.log(url + "读取数据成功");
      //TODO:回调函数，this指代当前的DataSouce对象
      handler(this);
    });
  }

  /**
   *构建空间索引结构, 必须在readData后才能构建空间索引
   *
   * @memberof DataSource
   */
  buildSpatialIndex(): void {
    let pipeNetWorks = this._pipeNetWorks;
    //pipeNetWorks[key]为WS_NETWORK、YS_NETWORK、HS_NETWORK
    for (let key in pipeNetWorks) {
      let pipeNetWork = pipeNetWorks[key];
      let edges = pipeNetWork.Edges;

      //TODO:初始化，给最小点的值赋值最大的坐标
      let min = new Cartesian3(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );
      //初始化，给最大点的值赋值最小的坐标
      let max = new Cartesian3(
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE
      );

      //循环的作用：第一个作用是遍历构建lines数组；
      //第二个作用是获取最小值点和最大值点。
      let lines = [];
      for (let i = 0; i < edges.length; i++) {
        let edge = edges[i];
        // 计算管线中心点坐标
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
        let mid = p0.add(p1).divideByScalar(2);

        //TODO:拷贝一份管线数据存储到空间索引结构中
        let line = {
          Type: edge.Type,
          LineWidth: edge.LineWidth,
          SmID: edge.SmID,
          Points: [
            {
              x: edge.Points[0].x,
              y: edge.Points[0].y,
              z: edge.Points[0].z,
            },
            {
              x: edge.Points[1].x,
              y: edge.Points[1].y,
              z: edge.Points[1].z,
            },
          ],
          Center: mid,
          Info: edge,
        };
        lines.push(line);

        // 重新计算包围盒
        max.x = Math.max(mid.x, max.x);
        max.y = Math.max(mid.y, max.y);
        max.z = Math.max(mid.z, max.z);

        min.x = Math.min(mid.x, min.x);
        min.y = Math.min(mid.y, min.y);
        min.z = Math.min(mid.z, min.z);
      }

      //TODO: 构建空间索引结构
      //TODO:容差0.0、节点最大点数100、最大深度8
      let octree = new PointOctree(min, max, 0.0, 100, 8);
      for (let i = 0; i < lines.length; i++) {
        octree.put(lines[i].Center, lines[i]);
      }

      //TODO:将空间索引结构挂在管网结构上,YS_NETWORK,WS_NETWORK,HS_NETWORK
      pipeNetWork.Octree = octree;

      // 根据管线中SMNodeID查找管点对象
      // let NodesMap:any = {};
      // let Nodes = pipeNetWork.Nodes;
      // for (let i = 0; i < Nodes.length; i++) {
      //   NodesMap[Nodes[i].SMNodeID.toString()] = Nodes[i];
      // }
    }

    console.log("buildSpatialIndex successfully for: " + this._url);
  }

  /**
   *
   *根据不同的批次数据构建对应批次的连通图
   * @memberof DataSource
   */
  buildConnectGraph(): void {
    let pipeNetWorks = this._pipeNetWorks;
    for (let key in pipeNetWorks) {
      // 每个数据集构造一个连通图
      let netWorkGraph = new Graph();

      //pipeNetWorks[key]为YS_NETWORK WS_NETWORK HS_NETWORK等
      let pipeNetWork = pipeNetWorks[key];
      let edges = pipeNetWork.Edges;
      let nodes = pipeNetWork.Nodes;

      // smid-->nodeInfo
      let nodesMap: any = {};
      for (let i = 0; i < nodes.length; i++) {
        let SmID = nodes[i].SmID;
        nodesMap[SmID] = nodes[i];
      }

      for (let i = 0; i < edges.length; i++) {
        let SmFid = edges[i].SMFNode;
        let SmTid = edges[i].SMTNode;

        // 获取起点与终点管点信息
        let fNodeInfo = nodesMap[SmFid];
        let tNodeInfo = nodesMap[SmTid];

        // 起点与终点管点的唯一标识符
        let PLPT0 = edges[i].PLPT0;
        let PLPT1 = edges[i].PLPT1;

        // 向连通图增加节点
        netWorkGraph.addVertex(PLPT0, fNodeInfo);
        netWorkGraph.addVertex(PLPT1, tNodeInfo);
      }

      // 向连通图中增加管线
      for (let i = 0; i < edges.length; i++) {
        let PLPT0 = edges[i].PLPT0;
        let PLPT1 = edges[i].PLPT1;
        netWorkGraph.addEdge(PLPT0, PLPT1, edges[i]);
      }

      // 将连通图挂在对应的管网上
      //TODO:pipeNetwork的结构变成了Edges，Nodes，Graph
      pipeNetWork.Graph = netWorkGraph;
    }
  }

  // buildDataSourceConnectGraphs(dataSources: DataSource[]) {
  /**
   *把当前批次的的DataSource构建成一整个连通图
   *
   * @memberof DataSource
   */
  buildDataSourceConnectGraphs(): void {
    //TODO:置空对象
    this.pipeGraph = new Graph();

    //TODO：声明 PLID==>edge
    // this.pipeLinesInfo:any = {};
    this.pipeLinesInfo = {};

    // 添加管点
    // for (let dataSource of dataSources) {
    //   let netWorks = dataSource.netWorks;

    //   for (let netWorkName in netWorks) {
    //     let netWork = netWorks[netWorkName];
    let pipeNetWorks = this._pipeNetWorks;
    for (let key in pipeNetWorks) {
      // 每个数据集构造一个连通图
      //   let netWork = new Graph();

      //pipeNetWorks[key]为YS_NETWORK WS_NETWORK HS_NETWORK等
      let netWork = pipeNetWorks[key];
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

        this.pipeGraph.addVertex(PLPT0, fNodeInfo);
        this.pipeGraph.addVertex(PLPT1, tNodeInfo);
      }
    }
    // }

    // 添加管线
    // for (let dataSource of dataSources) {
    //   let netWorks = dataSource.netWorks;
    //   for (let netWorkName in netWorks) {
    // let pipeNetWorks = this._pipeNetWorks;
    for (let key in pipeNetWorks) {
      // let netWork = netWorks[netWorkName];
      let netWork = pipeNetWorks[key];
      let edges = netWork.Edges;

      for (let edge of edges) {
        let PLPT0 = edge.PLPT0;
        let PLPT1 = edge.PLPT1;

        this.pipeGraph.addEdge(PLPT0, PLPT1, edge);

        //TODO:存储信息 存储管线信息,用于连通查询根据管线ID查询
        let PLID = edge.PLID;
        this.pipeLinesInfo[PLID] = edge;
      }
    }
    // }

    console.log(this._piBatch + "的连通图构建完毕!");
    // console.log("可以发送请求了!");
  }
}
