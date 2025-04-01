var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
var indexRouter = require('./routes/index');
var patientRouter = require('./routes/patient');
var usersRouter = require('./routes/users');
var volunteerRouter = require('./routes/volunteer');
var adminRouter = require('./routes/admin');
var matchRouter = require('./routes/match');
const flash = require('express-flash');
var app = express();
var db=require('./config/connection')
const session = require('express-session');
const hbs = require('hbs');
const InstitutionRouter = require('./routes/institution');
//var chatbotRouter = require('./routes/chatbot');

const exphbs = require('express-handlebars');

// Create handlebars instance with all helpers
const handlebars = exphbs.create({
  extname: '.hbs',
  defaultLayout: false, // This line disables the default layout requirement
  helpers: {
    join: function(array, separator) {
      return array ? array.join(separator) : '';
    },
    toFixed: function(number, digits) {
      return Number(number).toFixed(digits);
    },
    eq: function(a, b) {
      return a === b;
    },
    gte: function(a, b) {
      return a >= b;
    },
    includes: function(array, value) {
      return array.includes(value);
    }
    
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true, // ✅ Fix Handlebars "Access Denied" error
    allowProtoMethodsByDefault: true
  }
});

app.engine('hbs', handlebars.engine);




//hbs.registerPartials(path.join(__dirname, 'views', 'partials'));


hbs.registerHelper('join', function (array, separator) {
    return array ? array.join(separator) : '';
});



3
hbs.registerHelper('toFixed', function (number, digits) {
  return Number(number).toFixed(digits);
});

hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

app.use(session({
    secret: '281298jwkqwi2wjoq',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

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
app.use('/', patientRouter);
app.use('/', volunteerRouter);
app.use('/', adminRouter);
app.use('/', matchRouter);
app.use('/users', usersRouter);
app.use('/institution', InstitutionRouter);
//app.use('/chatbot', chatbotRouter);
//app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'isjkajskakshajh',
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
const PORT = process.env.PORT || 3000; // Render dynamically assigns a port

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



module.exports = app;
