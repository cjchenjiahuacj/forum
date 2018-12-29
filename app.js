let express = require("express");
let app = express();
let router = require("./router/router.js");
let session = require("express-session");//引入session

//设置模板引擎
app.set("view engine","ejs");

//引用静态资源
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));

//使用session中间件
app.use(session({
    name: "user_key",
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

//设置路由
app.get("/",router.showIndex);//首页
app.get("/communication",router.showCom);//交流页
app.get("/signUp",router.showSignUp);//注册页
app.post("/doSignUp",router.doSignUp);//执行注册
app.get("/login",router.showLogin);//登录页
app.post("/doLogin",router.doLogin);//执行登录
app.get("/doLogout",router.doLogout);//执行退出

app.get("/upAvatar",router.showUpAvatar);// 上传页面
app.post("/doUpAvatar",router.doAvatar);// 执行上传
app.get("/cut",router.showCut);//图片裁剪页
app.get("/doCut",router.doCut);//执行裁剪

app.get("/iPosting",router.showIPosting);//发帖页
app.post("/doPosting",router.doPosting);// 执行发帖

app.get("/getAllPost",router.getAllPost);//获取所有说说
app.post("/getUserInfo",router.getUserInfo);//获取某个用户的信息
app.get("/getAmount",router.getAmount);//获取说说的数量
app.get("/userList",router.showUserList);//显示用户列表页
app.get("/userList/:id",router.showUserPosts);//显示所有用户发过的评论

app.get("/detail/:id",router.showDetail);//详情页
app.post("/doComment",router.doComment);//发表评论
app.post("/getComment",router.getComment);//在相关的详情页获取有关评论

app.get("/person",router.showPerson);//展示个人页
app.post("/doPerson",router.doPerson);//执行修改个用户页

app.get("/getPostsNum",router.getPostsNum);//获取当前用户发过说说的总数
app.get("/giveALike",router.doGiveALike);//把点赞数加入posts表
app.get("/getHotTopic",router.getHotTopic);//根据点赞数由大到小选5条帖

app.listen(3000);