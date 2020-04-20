// 引入express库
import express from "express";
import bodyParser from "body-parser";

import path from "path";
import passport from "passport";
// const multer = require("multer");
// 引入controller对象
import * as userController from "./controllers/user";
import * as pipeLineAnalysisController from "./controllers/pipeLineAnalysis";
// 管线数据
import { PipeLine } from "./models/PipeLine";
import { DataSource } from "./models/Datasource";

// 引入passportConfig的配置信息
import * as passportConfig from "./config/passport";

const fileUpload = require("express-fileupload");

// 创建express服务器对象
const app = express();
// const router = express.Router();
app.use(fileUpload());

// 解决跨域问题
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  if (req.method == "OPTIONS") {
    res.send(200);
  } else {
    next();
  }
  //   next();
});
const router = express.Router();
// 配置服务器
app.set("port", process.env.PORT || 9081);

app.use(bodyParser.json());

// parse application/x-www-form-urlencoded

// 返回的对象是一个键值对，当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
app.use(bodyParser.urlencoded({ extended: true }));
// 配置静态资源路径
app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

app.use(passport.initialize());
app.use(passport.session());

// MongoDB、Postgresql数据库相关配置
// const mongoUrl = MONGODB_URI;
// mongoose.Promise = bluebird;
// mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } ).then(
//     () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
// ).catch(err => {
//     console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
//     // process.exit();
// });

// 用户模块路由
//app.get("/user/login", userController.getLogin);

// 3DTile数据发布模块路由
// app.get("/3dTiles/scene", sceneController.getScene);
// debugger;

// TODO:YJW20200407注释;
// //TODO:vue前端配置
// //1.上传文件
// app.post("/pipeLineAnalysis/uploadFile", pipeLineAnalysisController.uploadFile);

// app.get("/pipeLineAnalysis/configFile", pipeLineAnalysisController.configFile);

// app.get("/pipeLineAnalysis/fileList", pipeLineAnalysisController.fileList);

// app.get(
//   "/pipeLineAnalysis/updateConfigFile",
//   pipeLineAnalysisController.updateConfigFile
// );

//TODO:启动服务
app.get(
  "/pipeLineAnalysis/startServer",
  pipeLineAnalysisController.startServer
);

//TODO:express后台配置
// 返回连通图，前端显示，用于测试调试
app.get(
  "/pipeLineAnalysis/getConnectionGraph",
  pipeLineAnalysisController.getTestGraph
);

// 管线分析模块路由
// 净距分析接口
app.get(
  "/pipeLineAnalysis/distance",
  pipeLineAnalysisController.distanceAnalysis
);
// 碰撞分析接口
app.get(
  "/pipeLineAnalysis/collision",
  pipeLineAnalysisController.collisionAnalysis
);
// 横断面分析接口
app.get(
  "/pipeLineAnalysis/horizontalProfile",
  pipeLineAnalysisController.horizontalProfileAnalysis
);
// 纵断面分析，投影方法
app.get(
  "/pipeLineAnalysis/verticalProfile",
  pipeLineAnalysisController.verticalProfileAnalysis
);
// 测站区域分析-输入PLPT管点查询管点的上下游信息
app.get(
  "/pipeLineAnalysis/searchNodesByPLPT",
  pipeLineAnalysisController.searchNodesByPLPT
);
// 测站区域分析-输入PLPT管点查询管点的上下游信息
app.post(
  "/pipeLineAnalysis/searchNodesByPLPTPost",
  pipeLineAnalysisController.searchNodesByPLPTPost
);
// 测站区域分析-输入PLPT管点查询管点的上下游信息
app.post(
  "/pipeLineAnalysis/searchNodesByPLPTPostUp",
  pipeLineAnalysisController.searchNodesByPLPTPostUp
);
// 测站区域分析-输入PLPT管点查询管点的上下游信息
app.post(
  "/pipeLineAnalysis/searchNodesByPLPTPostDown",
  pipeLineAnalysisController.searchNodesByPLPTPostDown
);
// 输入PLID管线查询管线的上下游信息——爆管分析
app.get(
  "/pipeLineAnalysis/searchNodesByPLID",
  pipeLineAnalysisController.searchNodesByPLID
);
// 输入两根管线的id值，返回最短路径——连通分析
app.get("/pipeLineAnalysis/connected", pipeLineAnalysisController.connected);
export default app;
