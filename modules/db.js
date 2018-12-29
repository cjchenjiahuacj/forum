// 这个模块封装了对数据库的常用操作
let MongoClient = require("mongodb").MongoClient;
let setting = require("./setting.js");
// 连接数据库的函数
function _connectDB(dbName,callback) {
    let url = setting.dburl+dbName;
    // 连接数据库
    MongoClient.connect(url,{useNewUrlParser: true},function (err,client) {
        callback(err,client);
    });
}

// cIndex("chen","user");
// cIndex("chen","posts");
// 建立索引
function cIndex(dbName,collectName) {
    _connectDB(dbName,function (err,client) {
        //判断
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }
        // 建立索引
        let db = client.db(dbName);
        db.collection(collectName).createIndex({
            "username":1
        },null,function (err,result) {
            if (err){
                console.log("创建索引失败");
            }
            console.log("创建索引成功");
        });
    });
}

//插入数据
exports.insertOne = function (dbName,collectName,json,callback) { //数据库名称,集合名称,插入数据,回调
    _connectDB(dbName,function (err,client) {
        //判断
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }
        //插入数据
        let db = client.db(dbName);
        db.collection(collectName).insertOne(json,function (err,result) {
            // 需要自己写的
            callback(err,result);
            // 关闭数据库
            client.close();
        });
    })
};

//查找数据
exports.find = function (dbName,collectName,json,args,callback) { //args处理分页
    //每页的数目
    let limitNum = args.pagemount || 0;
    let skipNum = args.pagemount * args.page || 0;
    //排序
    let sort = args.sort || null;
    let result = [];
    let sum;
    let n = 0;
    _connectDB(dbName,function (err,client) {
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }
        //查询数据
        let db = client.db(dbName);
        let cursor = db.collection(collectName).find(json).skip(skipNum).limit(limitNum).sort(sort);
        // 数据的总数
        // cursor.count(function (err,c) {
        //     if (err){
        //         console(err);
        //     }
        //     sum = c;
        // });
        // cursor.forEach(function (doc) {
        //     n = n+1;
        //     result.push(doc);
        //     // 遍历结束的条件
        //     if (n === sum) {
        //         callback(null,result);
        //     }
        // },function (err) { //找不到的操作
        //     if (err){
        //         console.log(err);
        //     }
        //     callback(err,null);
        // });


        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                client.close(); //关闭数据库
                return;
            }
            if (doc != null) {
                result.push(doc);   //放入结果数组
            } else {
                //遍历结束，没有更多的文档了
                callback(null, result);
                client.close(); //关闭数据库
            }
        });




        // // 关闭数据库
        // client.close();
    })
};

//删除数据
exports.deleteMany = function (dbName,collectName,json,callback) {
    _connectDB(dbName,function (err,client) {
        // 检查
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }

        // 删除
        let db = client.db(dbName);
        db.collection(collectName).deleteMany(json,function (err,results) {
            callback(err,results);
            client.close();
        });
    })
};

//修改数据
exports.updateMany = function (dbName,collectName,json1,json2,callback) {
    _connectDB(dbName,function (err,client) {
        // 检查
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }

        //修改
        let db = client.db(dbName);
        db.collection(collectName).updateMany(json1,json2,function (err,results) {
            callback(err,results);
        })
    })
};

// 获取总数
exports.getCount = function (dbName,collectName,json,callback) {
    _connectDB(dbName,function (err,client) {
        // 检查
        if (err){
            console.log("数据库连接失败");
            client.close();
            return;
        }
        // 获取总数
        let db = client.db(dbName);
        db.collection(collectName).find(json).count(function (err,count) {
            callback(err,count);
            client.close();
        })
    })
};