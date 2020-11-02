//这里面是二级路由
//要通过express框架拿到当前的路由，才能获取到子路由
var express = require('express');
var router = express.Router();
//要操作数据库，要获取 mongoose 对象
var mongoose = require('mongoose');
//加载模型表
var Goods = require('../modules/goods');
let User = require('../modules/users');
//连接数据库
// let mongoUri = 'mongodb://127.0.0.1:27017/test';
let mongoUri = 'mongodb+srv://mongocloud:elmsmongocloud@cluster0.lpoc2.azure.mongodb.net/cloudData';
mongoose.connect(mongoUri, { useNewUrlParser: true })
    .catch((e) => {
        console.log(e.message);
        process.exit(1);
    }).then(() => {
        console.log("MongoDB connect success.")
    })

//二级路由，当访问到 / 时，回调
router.get("/list", (req, res, next) => {
    // 获取前端传来的参数，因为是get请求，能通过params拿到参数
    let params = {};
    let page = parseInt(req.query.page);
    let pageSize = parseInt(req.query.pageSize);
    let sort = req.query.sort;
    let skip = (page - 1) * pageSize;
    let priceLevel = req.query.priceLevel;
    let priceGt = 0, priceLte = 1;
    if (priceLevel != 'all') {
        switch (priceLevel) {
            case '0': priceGt = 0; priceLte = 1000; break;
            case '1': priceGt = 1000; priceLte = 3000; break;
            case '2': priceGt = 3000; priceLte = 9000; break;
        }
        params = {
            salePrice: {
                $gt: priceGt,
                $lte: priceLte
            }
        }
    }
    // mongoose 给模型封装了find方法,返回一个模型-----> {查找条件},<查找回调(报错，返回的文档)>
    let goodsModel = Goods.find(params).skip(skip).limit(pageSize); // 分页
    goodsModel.sort({ 'salePrice': sort }); //排序，排序规则由前端传过来 1升序，-1降序
    goodsModel.exec((err, doc) => { //exec 执行方法
        if (err) {
            //返回一个json文件
            res.json({
                status: '1',
                msg: err.message
            });
        } else {
            res.json({
                status: '0',
                msg: '',
                result: {
                    count: doc.length,
                    list: doc
                }
            })
        }
    })
});

//加入购物车
router.post("/addCart", (req, res, next) => {
    let userId = '123';
    // post 取参跟 get 取参 有区别
    let productId = req.body.productId;

    // 拿到用户 ID，查询该用户数据
    User.findOne({ userId: userId }, (err, userDoc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message
            })
        } else {
            if (userDoc) {
                // 判断 商品是否已经加过，加过则只是数量+1
                let goodsItem = '';
                userDoc.cartList.forEach((item) => {
                    if (item.productId == productId) {
                        goodsItem = item;
                        item.productNum++;
                    }
                });
                if (goodsItem) {

                    userDoc.save((err2, doc2) => {
                        if (err2) {
                            res.json({
                                status: '1',
                                msg: err2.message
                            })
                        } else {
                            res.json({
                                status: 0,
                                msg: 'suc',
                            })
                        }
                    })
                } else {
                    // 通过该商品ID查商品信息
                    Goods.findOne({ productId: productId }, (err, doc) => {
                        if (err) {
                            res.json({
                                status: '1',
                                msg: err.message
                            })
                        } else {
                            if (doc) {
                                doc.productNum = 1;
                                doc.checked = 1;
                                // 给该用户添加此商品信息
                                userDoc.cartList.push(doc);
                                // 保存到数据库
                                userDoc.save((err2, doc2) => {
                                    if (err2) {
                                        res.json({
                                            status: '1',
                                            msg: err2.message
                                        })
                                    } else {
                                        res.json({
                                            status: '0',
                                            msg: 'suc',
                                            result: 'suc'
                                        })
                                    }
                                })
                            }
                        }
                    })
                }

            }//
        }

    })
})

// 要导出，app.js才能拿到
module.exports = router;