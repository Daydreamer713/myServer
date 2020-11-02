var mongoose = require('mongoose');
var userScheme = new mongoose.Schema({
    // 定义字段，要跟数据库一致
    "userId": String,
    "userName": String,
    "userPwd": String,
    "orderList": Array,
    "cartList": [
        {
            "productId": String,
            "productName": String,
            "salePrice": String,
            "productImage": String,
            "checked": String,
            "productNum": Number
        }
    ],
    "addressList": [
        {
            "addressId": String,
            "userName": String,
            "streetName": String,
            "postCode": String,
            "tel": String,
            "isDefault": Boolean
        }
    ]
});

module.exports = mongoose.model("User", userScheme);