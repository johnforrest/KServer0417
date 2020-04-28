const logger = require("../../log/logger.js");
export class Graph {
  // 正向连通图
  private _adjacencyMap: any = {};
  // 逆向连通图
  private _adjacencyMapInv: any = {};

  // 存储连通图中节点信息
  private _vertexInfo: any = {};

  // 正向连通图中,终点编号=>管线信息
  private _adjacencyMapEdgeInfo: any = {};
  // 逆向连通图中,终点编号=>管线信息
  private _adjacencyMapInvEdgeInfo: any = {};

  /**
   *构建连通图
   * @memberof Graph
   */
  constructor() {
    this._adjacencyMap = {};
    this._adjacencyMapInv = {};
    this._vertexInfo = {};
    this._adjacencyMapEdgeInfo = {};
    this._adjacencyMapInvEdgeInfo = {};
  }

  /**
   *
   *获取正向连通图
   * @readonly
   * @memberof Graph
   */
  get adjacencyMap() {
    return this._adjacencyMap;
  }

  /**
   *获取逆向连通图
   *
   * @readonly
   * @memberof Graph
   */
  get adjacencyMapInv() {
    return this._adjacencyMapInv;
  }

  /**
   *
   *获取节点=>节点信息
   * @readonly
   * @memberof Graph
   */
  get vertexInfo() {
    return this._vertexInfo;
  }

  /**
   *
   *获取正向连通图邻接表中终止点，管线信息
   * @readonly
   * @memberof Graph
   */
  get adjacencyMapEdgeInfo() {
    return this._adjacencyMapEdgeInfo;
  }

  /**
   *
   *获取逆向连通图邻接表终止点，管线信息
   * @readonly
   * @memberof Graph
   */
  get adjacencyMapInvEdgeInfo() {
    return this._adjacencyMapInvEdgeInfo;
  }

  /**
   *
   *向连通图添加节点和节点信息对象
   * @param {string} vertex
   * @param {*} info
   * @memberof Graph
   */
  addVertex(vertex: string, info: any): void {
    this._adjacencyMap[vertex] = [];
    this._adjacencyMapInv[vertex] = [];

    this._vertexInfo[vertex] = info;
    this._adjacencyMapEdgeInfo[vertex] = [];
    this._adjacencyMapInvEdgeInfo[vertex] = [];
  }

  /**
   *连通图中是否包含指定节点
   *
   * @param {string} vertex
   * @returns {boolean}
   * @memberof Graph
   */
  containVertex(vertex: string): boolean {
    return typeof this._adjacencyMap[vertex] !== "undefined";
  }

  /**
   *添加连通图的边
   * @param {string} v：起点编号
   * @param {string} w：终点编号
   * @param {*} info：管线信息
   * @returns {boolean}
   * @memberof Graph
   */
  addEdge(v: string, w: string, info: any): boolean {
    let result = false;
    // 节点表中是否包含v与w
    if (this.containVertex(v) && this.containVertex(w)) {
      // 正向连通图
      this._adjacencyMap[v].push(w);
      // 逆向连通图
      this._adjacencyMapInv[w].push(v);

      // 存储正向图管线信息
      this._adjacencyMapEdgeInfo[v][w] = info;
      // 存储你逆向图管线信息
      this._adjacencyMapInvEdgeInfo[w][v] = info;

      result = true;
    }

    return result;
  }

  /**
   *打印连通图
   *
   * @memberof Graph
   */
  printGraph(): void {
    // 获取节点所有编号
    let keys = Object.keys(this._adjacencyMap);
    for (let i of keys) {
      let values = this._adjacencyMap[i];
      let vertex = "";
      for (let j of values) {
        vertex += j + " ";
      }
      console.log(i + " -> " + vertex);
    }
  }

  /**
   *
   *深度优先搜索-正向遍历-获取下游管线
   * @param {string} start
   * @returns {*}
   * @memberof Graph
   */
  dfs(start: string): any {
    let queue = [start];

    // 经过的节点编号
    let exploredNode: string[] = [];
    // 经过节点信息
    let exploredNodeInfo: any[] = [];

    // 经过的管线编号
    let exploredEdge: any[] = [];
    // 经过的管线信息
    let exploredEdgeInfo: any[] = [];

    // 终点点号
    let endNode: any[] = [];
    let endNodeInfo: any[] = [];

    while (queue.length != 0) {
      //弹出节点信息
      let v = queue.pop();

      if (exploredNode.indexOf(v) !== -1) continue;
      //存入经过的节点
      exploredNode.push(v);

      let info: any = {};
      //把连通图中此节点的信息拷贝出来
      Object.assign(info, this._vertexInfo[v]);

      info.PLPTNO = v;
      //存入经过的节点信息
      exploredNodeInfo.push(info);

      // 正向连通图
      if (this._adjacencyMap[v] != undefined) {
        // TODO:第一种情况，没有孩子说明到达一个分支的末尾了,就存入终点的数组里面
        if (0 == this._adjacencyMap[v].length) {
          endNode.push(v);
          endNodeInfo.push(info);
          // console.log("下游尾结点了！", v);
        }

        //TODO:第二种情况，有孩子节点说明还没有到达一个分支的末尾
        for (let i = 0; i < this._adjacencyMap[v].length; i++) {
          let w = this._adjacencyMap[v][i];
          // 正向查找管线
          // 正向连通图中终点编号 => 管线信息;
          let edgeInfo = this._adjacencyMapEdgeInfo[v][w];
          //放入到经过的边
          if (edgeInfo !== undefined) {
            let PLID = edgeInfo.PLID;
            if (exploredEdge.indexOf(PLID) == -1) {
              exploredEdge.push(PLID);
              exploredEdgeInfo.push(edgeInfo);
            }
            // console.log("PLID下游！", PLID);
          }

          if (exploredNode.indexOf(this._adjacencyMap[v][i]) == -1) {
            queue.push(this._adjacencyMap[v][i]);
            // console.log("进入下游队列了！", this._adjacencyMap[v][i]);
          }
        }
      }
    }

    return {
      exploredNode,
      exploredNodeInfo,
      exploredEdge,
      exploredEdgeInfo,
      endNode,
      endNodeInfo,
    };
  }

  /**
   *
   *逆向搜索-获取上游管线，非递归循环方式，邻接数组方式实现
   * @param {string} start
   * @returns {*}
   * @memberof Graph
   */
  dfsInv(start: string): any {
    let stack = [start];

    // 经过的节点编号
    let exploredNode: string[] = [];
    // 经过节点信息
    let exploredNodeInfo: any[] = [];

    // 经过的管线编号
    let exploredEdge: any[] = [];
    // 经过管线信息
    let exploredEdgeInfo: any[] = [];

    // 终点点号
    let endNode: any[] = [];
    let endNodeInfo: any[] = [];
    var flag = 0;
    while (stack.length != 0) {
      flag++;
      logger.info(
        "------------------------------------------------while循环----第" +
          flag +
          "次循环-------------"
      );
      //弹出并获取数组中最后一个元素，改变原始数组
      let v = stack.pop();

      if (exploredNode.indexOf(v) !== -1) {
        logger.info("while循环----最终的节点包含此节点，跳出循环");
        continue;
      }
      //TODO:存入节点编号，把当前点的节点存入到最终的节点列表中
      exploredNode.push(v);

      let info: any = {};
      //把连通图中此节点的信息拷贝出来
      Object.assign(info, this._vertexInfo[v]);
      //给管点赋值完点号之后，然后把此信息加到点号的数组中
      info.PLPTNO = v;
      //TODO:存入节点信息
      exploredNodeInfo.push(info);

      //连通图中包含此节点信息
      if (this._adjacencyMapInv[v] != undefined) {
        if (0 == this._adjacencyMapInv[v].length) {
          //TODO：没有孩子说明到达一个分支的末尾了
          endNode.push(v);
          endNodeInfo.push(info);
          logger.info("while循环----到达一个分支的尾结点了！", v);
        }
        //临接矩阵中此节点的长度不为零
        for (let i = 0; i < this._adjacencyMapInv[v].length; i++) {
          logger.info(
            "---------------for循环-------" +
              this._adjacencyMapInv[v].length +
              "长度开始------"
          );
          logger.info("-----------------" + i + "次开始----");
          //获取下一个节点
          let w = this._adjacencyMapInv[v][i];
          // 获取节点v和节点w的管线信息
          let edgeInfo = this._adjacencyMapInvEdgeInfo[v][w];
          if (edgeInfo !== undefined) {
            let PLID = edgeInfo.PLID;
            //TODO:如果边的集合中不包含此管线，则添加此管线信息
            if (exploredEdge.indexOf(PLID) == -1) {
              exploredEdge.push(PLID);
              exploredEdgeInfo.push(edgeInfo);
              logger.info("把经过管线压入管线队列", PLID);
            }
          }
          //如果此节点的没有再存储的经过节点数组中，则进行下一次的循环
          if (exploredNode.indexOf(w) == -1) {
            //TODO:yjw优化，这样就不需要重复往stack中存入了
            if (stack.indexOf(w) == -1) {
              stack.push(w);
              logger.info("把下一个节点压入队列，进行下一次循环", w);
            }
          }

          logger.info("--------------" + i + "次结束----");
        }
      }
    }

    return {
      exploredNode,
      exploredNodeInfo,
      exploredEdge,
      exploredEdgeInfo,
      endNode,
      endNodeInfo,
    };
  }

  /**
   *广度优先搜索
   *
   * @param {string} start
   * @returns {*}
   * @memberof Graph
   */
  bfs(start: string): any {
    let queue = [start];

    // 经过的节点编号
    let exploredNode: string[] = [];
    exploredNode.push(start);

    while (queue.length != 0) {
      let v = queue.shift();

      for (let i = 0; i < this._adjacencyMapInv[v].length; i++) {
        let w = this._adjacencyMapInv[v][i];
        if (exploredNode.indexOf(w) == -1) {
          exploredNode.push(w);
          queue.push(w);
        }
      }
    }

    return { exploredNode };
  }

  /**
   *
   *连通搜索，返回路径
   * @param {string} start
   * @param {string} end
   * @returns {*}
   * @memberof Graph
   */
  connected(start: string, end: string): any {
    let stack = [start];

    let exploredNode = [];

    while (stack.length != 0) {
      let v = stack[stack.length - 1];

      if (exploredNode.indexOf(v) != -1) {
        stack.pop();
      } else {
        exploredNode.push(v);
      }

      if (v == end) {
        // 输出路径stack
        console.log(exploredNode);
        console.log(stack);
        stack.pop();
        continue;
      }

      for (let i = 0; i < this._adjacencyMap[v].length; i++) {
        let w = this._adjacencyMap[v][i];
        if (exploredNode.indexOf(w) == -1) {
          if (stack.indexOf(v) == -1) {
            stack.push(v);
          }
          stack.push(w);
          break;
        } else {
          exploredNode.pop();
        }
      }
    }
  }

  /**
   *
   *最短路径：Dijkstra算法
   * @param {string} start
   * @param {string} end
   * @returns {*}
   * @memberof Graph
   */
  dikstra(start: string, end: string): any {
    const distanceFromStart: any = {};
    const previousVertex: any = {};
    let allNodes = this.dfs(start).exploredNode;
    if (allNodes.indexOf(end) == -1) {
      return { connected: false, distanceFromStart, previousVertex };
    }

    // 初始化两个表
    for (let i = 0; i < allNodes.length; i++) {
      let nodeID = allNodes[i];
      distanceFromStart[nodeID] = Infinity;
      previousVertex[nodeID] = "null";
    }
    distanceFromStart[start] = 0;

    // 再次遍历图更新表数据
    let stack = [start];
    let explored: any = [];
    while (stack.length != 0) {
      let v = stack.pop();

      if (explored.indexOf(v) !== -1) {
        continue;
      }
      explored.push(v);

      for (let i = 0; i < this._adjacencyMap[v].length; i++) {
        let w = this._adjacencyMap[v][i];
        let edge = this._adjacencyMapEdgeInfo[v][w];
        let length = edge.SMLength;

        let updateDistance = false;
        let isFirstUpdateDistance = false;
        if (distanceFromStart[w] == Infinity) {
          isFirstUpdateDistance = true;
        }
        if (distanceFromStart[w] > distanceFromStart[v] + length) {
          distanceFromStart[w] = distanceFromStart[v] + length;
          previousVertex[w] = v;
          updateDistance = true;
        }
        // 如果不是第一次更新了w节点的最短路径，则将w从已访问节点中移除
        if (!isFirstUpdateDistance && updateDistance) {
          if (explored.indexOf(w) != -1) {
            explored.splice(explored.indexOf(w), 1);
          }
        }

        if (explored.indexOf(w) == -1) {
          stack.push(w);
        }
      }
    }

    return { connected: true, distanceFromStart, previousVertex };
  }
}
