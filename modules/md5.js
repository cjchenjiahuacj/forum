let crypto = require("crypto");
module.exports = function(mingma){
    let md5 = crypto.createHash('md5');
    let pass = md5.update(mingma).digest('hex');
    return pass;
};