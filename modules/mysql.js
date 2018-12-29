let mysql = require('mysql');
//连接数据库的模块
function _connectDB(dbName) {
    let connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : dbName
    });
    connection.connect();
    return connection;
}

//查询
exports.exe = function(dbName,sql){
    return new Promise((resolve, reject) => {
        _connectDB(dbName).query(sql,function (err,results,fields) {
            if (err) {
                reject(err);
            }
            resolve(results,fields);
        });
        //结束
        _connectDB(dbName).end();
    });
};

//插入
exports.insert = function (dbName,addSql,callback) {
    _connectDB(dbName).query(addSql,function (err,results,fields) {
        if (err) {
            console.log('[INSERT ERROR] - ',err.message);
            return;
        }
        callback(results,fields);
    });
    //结束
    _connectDB(dbName).end();
};

//更新
exports.update = function (dbName,modSql,callback) {
    _connectDB(dbName).query(modSql,function (err,results,fields) {
        if (err) {
            console.log('[UPDATE ERROR] - ',err.message);
            return;
        }
        callback(results,fields);
    });
    //结束
    _connectDB(dbName).end();
};

//删除
exports.delete = function (dbName,delSql,callback) {
    _connectDB(dbName).query(delSql,function (err,results,fields) {
        if (err) {
            console.log('[DELETE ERROR] - ',err.message);
            return;
        }
        callback(results,fields);
    });
    //结束
    _connectDB(dbName).end();
};