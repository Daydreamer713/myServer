var express = require('express');
var router = express.Router();
var User = require('./../modules/users');
require('./../util/date') //不用导出，连导入都不用存值
// 登录接口
router.post("/login", (req, res, next) => { //next 就是不处理请求，继续执行下一步
  let params = {
    userName: req.body.userName,
    userPwd: req.body.userPwd,
  }
  User.findOne(params, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.messages
      });
    } else {
      if (doc) {
        // 写 cookie
        res.cookie("userId", doc.userId, {
          path: '/',
          maxAge: 1000 * 60 * 60,// 一小时
        });
        res.cookie("userName", doc.userName, {
          path: '/',
          maxAge: 1000 * 60 * 60,// 一小时
        });
        // 要安装 Express session 插件才能使用
        // req.session.user = doc;
        res.json({
          status: 0,
          msg: '',
          result: {
            userName: doc.userName
          }
        })
      }
    }
  })
});

// 注销接口
router.post("/logout", (req, res, next) => {
  // 清除 cookie 
  res.cookie("userId", "", {
    path: "/",
    maxAge: -1
  })
  res.json({
    status: 0,
    msg: '',
    result: '',
  })
});

// 登录校验
router.get("/checkLogin", (req, res, next) => {
  if (req.cookies.userId) {
    res.json({
      status: 0,
      msg: '',
      result: '' || req.cookies.userName
    })
  } else {
    res.json({
      status: 1,
      msg: '未登录',
      result: ''
    })
  }
})

// 获取当前用户的购物车数据
router.get('/cartList', (req, res, next) => {
  // 获取用户id
  let userId = req.cookies.userId;
  User.findOne({ userId: userId }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      });
    } else {
      if (doc) {
        res.json({
          status: 0,
          msg: 'suc',
          result: doc.cartList
        })
      }
    }
  })

})

// 删除某条购物车信息
router.post("/delCartItem", (req, res, next) => {
  let userId = req.cookies.userId;
  let productId = req.body.productId;
  //拿到当前用户的购物车信息，遍历，如果与传入的id相同则删除
  User.update({
    userId: userId // 删除目标
  }, {
    $pull: {    // 删除数据源
      'cartList': {
        'productId': productId
      }
    }
  }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      });
    } else {
      res.json({
        status: 0,
        msg: '',
        result: 'suc'
      })
    }
  })
});

// 修改购物车商品数量
router.post('/cartEdit', (req, res, next) => {
  let userId = req.cookies.userId;
  let productId = req.body.productId;
  let productNum = req.body.productNum;
  let checked = req.body.checked;
  // mongodb 的更新数据API：update（查询条件，更新目标，更新内容）
  User.update({ "userId": userId, "cartList.productId": productId }, { //可通过 . 的方式查到子文档
    "cartList.$.productNum": productNum,      // $ 是一个占位符
    "cartList.$.checked": checked,
  }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message
      })
    } else {
      res.json({
        status: 0,
        msg: '',
        result: 'suc'
      })
    }
  })
});

// 全选计算总金额
router.post("/editCheckAll", (req, res, next) => {
  let userId = req.cookies.userId;
  let checkAll = req.body.checkAll ? '1' : '0';
  // 批量更新子文档的笨方法，通过遍历用户下的子文档实现更新
  User.findOne({ userId: userId }, (err, user) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      });
    } else {
      if (user) {
        user.cartList.forEach((item) => {
          item.checked = checkAll;
        })
        user.save((err1, doc) => {
          if (err1) {
            res.json({
              status: 1,
              msg: err1.message,
              result: ''
            })
          } else {
            res.json({
              status: 0,
              msg: '',
              result: 'suc'
            })
          }
        })
      }
    }
  })
})

// 查询用户地址
router.get("/addressList", (req, res, next) => {
  let userId = req.cookies.userId;
  User.findOne({ userId: userId }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      });
    } else {
      res.json({
        status: 0,
        msg: '',
        result: doc.addressList
      });
    }
  })
})

// 设置默认地址
router.post("/setDefault", (req, res, next) => {
  let userId = req.cookies.userId;
  let addressId = req.body.addressId;
  if (!addressId) {
    res.json({
      status: '1003',
      msg: 'addressId is null',
      result: ''
    })
  } else {
    // 找到当前用户的默认地址，并且改掉它和当前选中的item的值
    User.findOne({ userId: userId }, (err, doc) => {
      if (err) {
        res.json({
          status: 1,
          msg: err.message,
          result: ''
        });
      } else {
        let addressList = doc.addressList;
        addressList.forEach((item) => {
          // 将当前 item 的默认地址设为true，其他都为false
          if (item.addressId == addressId) {
            item.isDefault = true;
          } else {
            item.isDefault = false;
          }
        });
        doc.save((err1, doc1) => {
          if (err) {
            res.json({
              status: 1,
              msg: err.message,
              result: ''
            })
          } else {
            res.json({
              status: 0,
              msg: '',
              result: ''
            })
          }
        })
      }
    })
  }
})

// 删除地址
router.post("/delAddress", (req, res, next) => {
  let userId = req.cookies.userId;
  let addressId = req.body.addressId;
  User.update({
    userId: userId
  }, {
    $pull: {
      'addressList': {
        'addressId': addressId
      }
    }
  }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message, // 查数据库时候的报错
        result: ''
      })
    } else {
      res.json({
        status: 0,
        msg: '',
        result: ''
      })
    }
  });
});

// 支付订单
router.post("/payMent", (req, res, next) => {
  let userId = req.cookies.userId;
  let addressId = req.body.addressId;
  let orderTotal = req.body.orderTotal;
  // 查询该用户，保存订单信息
  User.findOne({ userId: userId }, (err, doc) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      })
    } else {
      let address = '',
        goodsList = [];
      // 获取当前用户的地址信息
      doc.addressList.forEach((item) => {
        if (addressId == item.addressId) {
          address = item;
        }
      })
      // 获取用户购物车选择的商品
      doc.cartList.filter((item) => {
        if (item.checked == 1) {
          goodsList.push(item);
        }
      });
      // 19位随机数创建订单ID 
      let platform = '622'; //系统平台码
      let r1 = Math.floor(Math.random() * 10); // 生成 0-9 随机数
      let r2 = Math.floor(Math.random() * 10);

      let sysDate = new Date().Format('yyyyMMddhhmmss');
      let createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');
      let orderId = platform + r1 + sysDate + r2;
      let order = {
        orderId: orderId,
        orderTotal: orderTotal,
        addressList: goodsList,
        orderStatus: 1,
        createDate: createDate,
      };
      doc.orderList.push(order);
      doc.save((err1, doc1) => {
        if (err1) {
          res.json({
            status: 1,
            msg: err1.message,
            result: ''
          })
        } else {
          res.json({
            status: 0,
            msg: '',
            result: {
              orderId: order.orderId,
              orderTotal: order.orderTotal,
            }
          })
        }
      })
    }
  })
})

// 根据订单ID查询订单信息
router.get("/orderDetail", (req, res, next) => {
  let userId = req.cookies.userId,
    orderId = req.query.orderId;
  User.findOne({ userId: userId }, (err, userInfo) => {
    if (err) {
      res.json({
        status: 1,
        msg: err.message,
        result: ''
      });
    } else {
      let orderList = userInfo.orderList;
      if (orderList.length > 0) {
        let orderTotal = 0;
        orderList.forEach((item) => {
          // 找到该orderId的订单信息
          if (item.orderId == orderId) {
            orderTotal = item.orderTotal;
          }
        });
        if (orderTotal > 0) {
          res.json({
            status: 0,
            msg: '',
            result: {
              orderId: orderId,
              orderTotal: orderTotal
            }
          })
        } else {
          res.json({
            status: '120002',
            msg: '找不到该订单',
            result: ''
          })
        }
      } else {
        res.json({
          status: '120001',
          msg: '该用户没创建订单',
          result: ''
        })
      }
    }
  })
})

// 查询购物车商品数量
router.get("/getCartCount", (req, res, next) => {
  if (req.cookies && req.cookies.userId) {
    let userId = req.cookies.userId;
    User.findOne({ userId: userId }, (err, doc) => {
      if (err) {
        res.json({
          status: 1,
          msg: err.message,
          result: ''
        });
      } else {
        let cartList = doc.cartList;
        let cartCount = 0;
        cartList.map((item) => {
          cartCount += parseInt(item.productNum);
        })
        res.json({
          status: 1,
          msg: '',
          result: cartCount
        })
      }
    })
  }
})
module.exports = router;
