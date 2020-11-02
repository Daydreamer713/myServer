let mongoose = require('mongoose');
let Schema = mongoose.Schema; // 定义表模型

let produtSchema = new Schema({
    "productId": String,
    "productName": String,
    "salePrice": Number,
    "productImage": String,
    "checked": String,
    "productNum": Number
});

// 暴露模型，基于这个模型调用它的 API 方法，然后在router里定义一个路由
module.exports = mongoose.model('Good', produtSchema);