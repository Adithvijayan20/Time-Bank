var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var db=require('./config/connection')
const session = require('express-session');
const hbs = require('hbs');


hbs.registerHelper('join', function (array, separator) {
    return array ? array.join(separator) : '';
});
3

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `true` if using HTTPS
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','hbs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
db.connect((err)=>{
  if(err) console.log("error");
    else console.log("connected");
    
})
app.use('/', indexRouter);
app.use('/users', usersRouter); // Direct access at /volunteer-profile
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
