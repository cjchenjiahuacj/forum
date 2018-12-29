let db = require("../modules/db.js");// 引入db模块
let formidable = require('formidable');// 引入formidable模块
let md5 = require("../modules/md5.js");// 加密模块
let path = require("path");// 引入路径模块
let fs = require("fs");// 引入文件模块
let gm = require("gm");// 引入gm模块
let ObjectId = require("mongodb").ObjectId;
let dbMySql = require("../modules/mysql.js");// 引入mysql


//首页
exports.showIndex = function (req, res, next) {
    res.render("index");
};

//交流页
exports.showCom = function (req, res, next) {
    //检测如果是登录状态，检索数据库，看头像
    if (req.session.login === "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }

    dbMySql.exe("iforum","select username,avatar from user where username='"+username+"'").then((results)=>{
        if (results.length === 0) {
            var avatar = "default.jpg";
        } else {
            var avatar = results[0].avatar;
        }
        res.render("communication", {
            "login": login,
            "username": username,
            "active": "communication",
            "avatar": avatar
        });
    }).catch((e)=>{
        console.log("找不到"+e);
    })
};

//注册页
exports.showSignUp = function (req, res, next) {
    res.render("signup", {
        "login": req.session.login === "1",
        "username": req.session.login === "1" ? req.session.username : "",
        "active": "signup"
    });
};

//登录页
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login === "1",
        "username": req.session.login === "1" ? req.session.username : "",
        "active": "login"
    });
};

//执行注册
exports.doSignUp = function (req, res, next) {
    //post
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到用户数据
        let username = decodeURI(fields.username);
        let password = fields.password;
        let isChecked = fields.isChecked;
        console.log(isChecked);
        //加密
        let ePassword = md5(password);
        //查询数据库是否存在该用户
        dbMySql.exe("iforum","select username from user").then((results)=>{
            for (let i=0;i<results.length;i++){
                if (results.username === username){
                    res.end("-1");// 找到这个人
                    return;
                }
            }
            //加入该数据库
            dbMySql.exe("iforum","INSERT INTO user (username, password,avatar) VALUES ('"+username+"', '"+ePassword+"','default.jpg');").then(()=>{
                if (isChecked) {
                    req.session.login = "1";//记录登录状态
                    req.session.username = username;//记录用户名
                }
                res.end("1");//注册成功，写入session 立刻登录
            }).catch((e)=>{
                console.log("插入失败" + e);
            })
        }).catch((e)=>{
            console.log("找不到"+e);
        });
    });
};

//执行登录
exports.doLogin = function (req, res, next) {
    // 处理post请求
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //获取用户信息
        let username = decodeURI(fields.username);
        let password = fields.password;
        //加密
        let ePassword = md5(password);
        //查询数据库是否有该用户 比较密码
        dbMySql.exe("iforum","select avatar,password from user where username='"+username+"'").then((results)=>{
            if (results.length === 0) {
                res.send("-1");//找不到
                return;
            }
            if (results[0].password === ePassword) {
                // 记录登录状态
                req.session.login = "1";
                req.session.username = username;
                req.session.dbAvatar = results[0].avatar;//存在数据库中的头像
                res.send("1");
            } else {
                res.send("-2");// 密码错误
            }
        }).catch((e)=>{
            console.log("找不到"+e);
        })
    });
};

//执行退出
exports.doLogout = function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log("退出失败");
            return;
        }
        //清除登录cookie
        res.clearCookie("user_key");
        res.redirect("/communication");
    });
};

//设置头像页面必须保持是登录状态
exports.showUpAvatar = function (req, res, next) {
    if (req.session.login !== "1") {
        res.send("该页面需要登录");
        return;
    }
    res.render("upavatar", {
        "login": true,
        "username": req.session.username,
        "active": "setAvatar"
    });
};

//执行上传
exports.doAvatar = function (req, res, next) {
    let form = new formidable.IncomingForm();
    form.uploadDir = path.resolve(__dirname, "../avatar");//设置上传的文件夹
    form.parse(req, function (err, fields, files) {
        // 旧的上传路径
        let oldPath = files.file.path;
        let newPath = path.resolve(__dirname, "../avatar") + '/' + req.session.username + ".jpg";
        // 改名
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                console.log(err);
                res.send("上传失败");
                return;
            }
            req.session.avatar = req.session.username;
            res.redirect("/cut");
        });
    });
};

// 图片裁剪页
exports.showCut = function (req, res, next) {
    res.render("cut", {
        "avatar": req.session.avatar
    });
};

// 执行裁剪
exports.doCut = function (req, res, next) {
    // 接收get请求参数
    let fileName = req.session.avatar;
    let w = req.query.w;
    let h = req.query.h;
    let x = req.query.x;
    let y = req.query.y;
    //gm
    gm("./avatar/" + fileName + ".jpg").crop(w,h,x,y).resize(200, 200,"!").write("./avatar/" + fileName + ".jpg", function (err) {
        if (err) {
            res.send("-1");
            return;
        }
        // 更新当前用户数据库的avatar值
        dbMySql.exe("iforum","UPDATE user SET avatar='"+req.session.avatar+".jpg' WHERE username='"+req.session.username+"';").then(()=>{
            res.send("1");
        }).catch((e)=>{
            console.log("更新失败"+e);
        })
    });
};

// 展示发帖页
exports.showIPosting = function (req, res, next) {
    // 需要用户登录
    if (req.session.login !== "1"){
        res.send("该页面需要登录");
        return;
    }
    dbMySql.exe("iforum","select * from user left join post on user.id=post.user_id where username='"+req.session.username+"' order by date desc").then((results)=>{
        res.render("iposting", {
            "login": req.session.login === "1",
            "username": req.session.login === "1" ? req.session.username : "",
            "active": "iposting",
            "iposts":results,
            "crtTimeFtt": function crtTimeFtt(date) { // 传入时间对象
                let h = date.getDate();
                let m = date.getMinutes();
                let s = date.getSeconds();
                if (h<10){
                    h = "0"+h;
                }else if (m<10){
                    m = '0'+m;
                } else if(s<10){
                    s = '0'+s;
                }
                return date.getFullYear()+"-"+(date.getMonth() + 1) + "-" + date.getDate()+ "   " + h + ":" + m + ":" + s
            }
        });
    }).catch((e)=>{
        console.log("找不到"+e);
    });
};

//执行发帖
exports.doPosting = function (req, res, next) {
    let username = req.session.username;
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //获取输入的内容
        let content = fields.content;
        let title = fields.title;
        // 往posts表插入数据
        //加入该数据库
        dbMySql.exe("iforum","select id from user where username='"+username+"'").then((results)=>{
            dbMySql.exe("iforum","INSERT INTO post (title,content,love,user_id,date) VALUES ('"+title+"','"+content+"',0,"+results[0].id+",now());").then(()=>{
                res.send("1");//插入成功
            }).catch((e)=>{
                console.log("插入失败"+e);
                res.send("-3");//服务器错误
            })
        }).catch((e)=>{
            console.log("找不到"+e);
        })
    });
};

// 列出所有说说 有分页功能
exports.getAllPost = function (req,res,next) {
    let page = req.query.page;
    let skip = parseInt(page)*20;
    dbMySql.exe("iforum","select post.id,title,date,username,avatar from post,user where user.id = post.user_id order by date desc limit "+skip+",20").then((results)=>{
        res.json(results);
    }).catch((e)=>{
        console.log("查找失败"+e);
    })
};

//列出用户的信息
exports.getUserInfo = function (req,res,next) {
    let username = req.query.username;
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //获取输入的内容
        let id = fields.id;
        db.find("chen", "user", {"_id": ObjectId(id)}, {}, function (err, result) {
            let obj = {
                "username": result[0].username,
                "avatar": result[0].avatar
            };
            res.json(obj);
        });
    })
};

//获取说说的数量
exports.getAmount = function (req,res,next) {
    dbMySql.exe("iforum","select count(id) as num from post").then((count)=>{
        res.json(count[0].num);
    }).catch((e)=>{
        console.log(e);
    })
};


//显示用户列表
exports.showUserList = function (req,res,next) {
    dbMySql.exe("iforum","select id,username,avatar from user").then((results)=>{
        res.render("userlist", {
            "login": req.session.login === "1",
            "username": req.session.login === "1" ? req.session.username : "",
            "dbAvatar": req.session.dbAvatar,
            "users": results,
            "active": "userlist"
        });
    }).catch((e)=>{
        console.log("用户列表查询失败"+e);
    })
};

//显示用户帖
exports.showUserPosts = function (req,res,next) {
    let id = req.params["id"];
    dbMySql.exe("iforum","select * from post where user_id="+id+" order by date desc").then((results)=>{
        res.render("usersposts",{
            "login": req.session.login === "1",
            "username": req.session.login === "1" ? req.session.username : "",
            "dbAvatar": req.session.dbAvatar,
            "active": "userlist",
            "usersPosts":results,
            "crtTimeFtt": function crtTimeFtt(date) { // 传入时间对象
                let h = date.getDate();
                let m = date.getMinutes();
                let s = date.getSeconds();
                if (h<10){
                    h = "0"+h;
                }else if (m<10){
                    m = '0'+m;
                } else if(s<10){
                    s = '0'+s;
                }
                return date.getFullYear()+"-"+(date.getMonth() + 1) + "-" + date.getDate()+ "   " + h + ":" + m + ":" + s
            }
        })
    }).catch((e)=>{
        console.log(e);
    });
};

//展示详情页
exports.showDetail = function (req,res,next) {
    //与该id相关的用户名 发帖的内容 相关评论
    let id = parseInt(req.params["id"]);
    dbMySql.exe("iforum","select user.id,username,avatar,post.id,title,content,love,date from user,post where user.id=post.user_id and post.id="+id).then((results)=>{
        res.render("detail",{
            "login": req.session.login === "1",
            "username": req.session.login === "1" ? req.session.username : "",
            "dbAvatar": req.session.dbAvatar,
            "active": "detail",
            "crtTimeFtt": function crtTimeFtt(date) { // 传入时间对象
                return (date.getMonth() + 1) + "-" + date.getDate() + "," + date.getFullYear()
            },
            "detail":results,
        });
    }).catch((e)=>{
        console.log("查询失败"+e);
    });
};

//执行评论
exports.doComment = function (req,res,next) {
    //获取用户信息 评论内容
    let username = req.session.username;
    let avatar = req.session.dbAvatar;
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //获取输入的内容
        let comment = fields.comment;
        let id = fields.id;
        // 往comment表插入数据
        //加入该数据库
        dbMySql.exe("iforum","INSERT INTO comment (comment,date,post_id,from_user) VALUES ('"+comment+"',now(),"+id+",'"+username+"')").then(()=>{
            res.send("1");//插入成功
        }).catch((e)=>{
            console.log("查找失败"+e);
            res.send("-3");//服务器错误
        })
    });
};

//获得相关评论
exports.getComment = function (req,res,next) {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        dbMySql.exe("iforum","select avatar,comment.id,date,comment,post_id,from_user from comment,user where post_id="+parseInt(fields.id)+" and comment.from_user=user.username order by date desc").then((results)=>{
            res.json(results);
        }).catch((e)=>{
            console.log("查找失败"+e);
        })
    });
};

//展示个人页
exports.showPerson = function (req,res,next) {
    res.render("person",{
        "login": req.session.login === "1",
        "username": req.session.login === "1" ? req.session.username : "",
        "dbAvatar": req.session.dbAvatar,
        "active": "person"
    });
};

//执行个人页的保存
exports.doPerson = function (req,res,next) {
    let form = new formidable.IncomingForm();
    form.uploadDir = path.resolve(__dirname, "../avatar");//设置上传的文件夹
    form.parse(req, function (err, fields, files) {
        //获取输入的内容
        let username = fields.user;
        //要删除文件的路径
        let oldPath = files.file.path;
        let newPath = path.resolve(__dirname,"../avatar")+"/"+username+".jpg";
        //修改名字
        fs.rename(oldPath,newPath,function (err) {
            if (err) {
                console.log("上传失败");
                return;
            }
            // //删除原来的头像
            // fs.unlinkSync(path.resolve(__dirname,"../avatar")+"/"+req.session.username+".jpg",function (err) {
            //     if (err) throw err;
            //     console.log('文件已删除');
            // });
            //直接裁剪
            gm("./avatar/" + username + ".jpg").resize(200).write("./avatar/" + username + ".jpg", function (err) {
                if (err) {
                    res.send("-1");
                    return;
                }
                // 更新当前用户数据库的
                dbMySql.exe("iforum","UPDATE user SET username='"+username+"',avatar='"+username+".jpg' WHERE username='"+req.session.username+"'").then(()=>{
                    //修改session
                    req.session.username = username;
                    req.session.dbAvatar = username+'.jpg';
                    res.redirect("/communication");
                }).catch((e)=>{
                    console.log("更新失败"+e);
                })
            });
        });
    });
};

//取当前用户发过说说的总数
exports.getPostsNum = function (req,res,next) {
    //查找当前用户的id
    dbMySql.exe("iforum","select count(id) as num from post where user_id in (select id from user where username='"+req.session.username+"')").then((count)=>{
        res.json(count[0].num);
    }).catch((e)=>{
        console.log("查找总数失败"+e);
    })
};

//把点赞数加入post表
exports.doGiveALike = function (req,res,next) {
    let likeNum = req.query.like;
    let id = req.query.id;
    //给当前帖更新
    dbMySql.exe("iforum","UPDATE post SET love="+likeNum+" WHERE post_id="+id).then(()=>{
        res.send("1");
    }).catch((e)=>{
        console.log(e);
    })
};

//根据点赞数由大到小选5条帖
exports.getHotTopic = function (req,res,next) {
};