import app from "./app";

// 启动服务器，查询端口号，成功的话返回回调函数
const server = app.listen(app.get("port"), () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    //查询端口号和名称
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

export default server;
