import { DataSource } from "./Datasource";

export class PipeLineBatch {
  private _dataSources: { [key: string]: DataSource } = {};

  constructor() {}

  // 添加一个数据源
  addDataSource(dataSource: DataSource) {
    let piBatch = dataSource.piBatch;
    this._dataSources[piBatch] = dataSource;
  }

  // 根据batchid返回对应的数据源
  getDataSource(piBatch: string): DataSource {
    return this._dataSources[piBatch];
  }

  // 获取数据源集合
  getAllDataSources(): { [key: string]: DataSource } {
    return this._dataSources;
  }
}
