//处理时间
Date.prototype.format = function (format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
}
// Date.daysInMonth = function (year, month) {
//     if (month == 1) {
//         if (year % 4 == 0 && year % 100 != 0)
//             return 29;
//         else
//             return 28;
//     } else if ((month <= 6 && month % 2 == 0) || (month = 6 && month % 2 == 1))
//         return 31;
//     else
//         return 30;
// };
// Date.prototype.addMonth = function (addMonth) {
//     var y = this.getFullYear();
//     var m = this.getMonth();
//     var nextY = y;
//     var nextM = m;
//     //如果当前月+要加上的月>11 这里之所以用11是因为 js的月份从0开始
//     if (m > 11) {
//         nextY = y + 1;
//         nextM = parseInt(m + addMonth) - 11;
//     } else {
//         nextM = this.getMonth() + addMonth
//     }
//     var daysInNextMonth = Date.daysInMonth(nextY, nextM);
//     var day = this.getDate();
//     if (day > daysInNextMonth) {
//         day = daysInNextMonth;
//     }
//     return new Date(nextY, nextM, day);
// };