var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ejs = require('ejs');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var goodsRouter = require('./routes/goods');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express); //将 jade 换成 html
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 注入路由之前捕获登录
// use 注入中间件，注入路由，参数是function，在使用任何路由方法之前就会优先进去
app.use((req, res, next) => {
  //取 cookie
  if (req.cookies.userId) {
    next(); // 让操作继续
  } else {
    // 添加路由白名单, originalUrl:接口地址
    if (req.originalUrl == '/users/login'
      || req.originalUrl == '/users/logout'
      // || req.originalUrl =='/users/goods' 错误，goods是一个路径，后面拼接着一串参数
      // || req.originalUrl.indexOf("/goods/list")>-1  解决方案1
      // 最佳方案：req.path 匹配路径，不用考虑参数，相当于前端的 location.pathname
      || req.path=="/goods/list"
    ) {
      next();
    } else {
      res.json({
        status: '10001',
        msg: "当前未登录",
        result: '',
      })
    }
  }
});

// app.js 文件里是一级路由
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/goods', goodsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
