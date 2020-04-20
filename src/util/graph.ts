export class Graph {
  // 正向连通图
  private _adjacencyMap: any = {};
  // 逆向连通图
  private _adjacencyMapInv: any = {};

  // 存储连通图中节点信息
  private _vertexInfo: any = {};
  // 正向连通图中终点编号=>管线信息
  private _adjacencyMapEdgeInfo: any = {};
  // 逆向连通图中终点编号=>管线信息
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

  // 正向连通图
  get adjacencyMap() {
    return this._adjacencyMap;
  }

  // 逆向连通图
  get adjacencyMapInv() {
    return this._adjacencyMapInv;
  }

  // 节点=>节点信息
  get vertexInfo() {
    return this._vertexInfo;
  }

  // 正向连通图邻接表中终止点管线信息
  get adjacencyMapEdgeInfo() {
    return this._adjacencyMapEdgeInfo;
  }

  // 逆向连通图邻接表终止点管线信息
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
   * @param {*} info
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
   *深度优先搜索-正向遍历
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
          console.log("进入尾结点了！", endNode.pop);
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
          }

          if (exploredNode.indexOf(this._adjacencyMap[v][i]) == -1) {
            queue.push(this._adjacencyMap[v][i]);
            console.log("进入队列了！", queue.pop());
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
   *逆向搜索
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

    while (stack.length != 0) {
      let v = stack.pop();

      if (exploredNode.indexOf(v) !== -1) continue;

      exploredNode.push(v);

      let info: any = {};
      Object.assign(info, this._vertexInfo[v]);
      info.PLPTNO = v;
      exploredNodeInfo.push(info);

      if (this._adjacencyMapInv[v] != undefined) {
        // 没有孩子说明到达一个分支的末尾了
        if (0 == this._adjacencyMapInv[v].length) {
          endNode.push(v);
          endNodeInfo.push(info);
        }

        for (let i = 0; i < this._adjacencyMapInv[v].length; i++) {
          let w = this._adjacencyMapInv[v][i];
          // 逆向查找管綫
          let edgeInfo = this._adjacencyMapInvEdgeInfo[v][w];
          if (edgeInfo !== undefined) {
            let PLID = edgeInfo.PLID;
            if (exploredEdge.indexOf(PLID) == -1) {
              exploredEdge.push(PLID);
              exploredEdgeInfo.push(edgeInfo);
            }
          }

          if (exploredNode.indexOf(w) == -1) {
            stack.push(w);
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
