const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require("http-errors");
const helmet = require("helmet");

const indexRouter = require('./routes/index');
const serverHost = require("./middlewares/serverHost");
const headers = require("./middlewares/headers");
const authorization = require("./middlewares/authorization");

const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(headers);
app.use(serverHost);
app.use(authorization);

app.use('/', indexRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({
    status: 'error',
    message: err.message,
    stack: err.stack,
    errors: err.errors,
  });
});

module.exports = app;
