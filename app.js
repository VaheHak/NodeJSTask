const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require("http-errors");
const helmet = require("helmet");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const indexRouter = require('./routes/index');
const serverHost = require("./middlewares/serverHost");
const headers = require("./middlewares/headers");
const authorization = require("./middlewares/authorization");

const app = express();

const swaggerOptions = {
  swaggerDefinition: {
    swagger: '2.0',
    info: {
      version: "1.0.0",
      title: "Node API",
      description: "Node API Information",
      contact: {
        name: "NodeJs Task"
      },
      servers: ["http://localhost:3000"],
      authAction: {
        JWT: {
          name: "JWT",
          schema: {type: "apiKey", in: "header", name: "authorization", description: ""},
          value: "Bearer <JWT>"
        }
      }
    },
    securityDefinitions: {
      ApiKeyAuth: {
        type: "apiKey",
        name: "X-API-KEY",
        in: "header",
        value: "lknasdaoinjol12341lknlk2314n123k4jjb1kljn3r42kjn3242kjnblkjnxalkn"
      },
      JWT: {
        type: "apiKey",
        name: "authorization",
        in: "header",
      }
    },
  },
  apis: ["app.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
/**
 * @swagger
 * /all_users:
 *  get:
 *    tags: [Get user list]
 *    description: Use to request all users
 *    parameters:
 *      - name: page
 *        in: query
 *        description: Page for users
 *        required: true
 *        schema:
 *          type: number
 *          format: number
 *    responses:
 *      '200':
 *        description: A successful response
 *    security:
 *      - bearerAuth: []
 *      - api_key: []
 */
/**
 * @swagger
 * /register:
 *  post:
 *    tags: [User registration]
 *    description: Use to registration
 *    consumes:
 *      - multipart/form-data
 *    parameters:
 *      - name: email
 *        in: body
 *        description: Email of our user
 *        required: true
 *        schema:
 *          type: string
 *          format: email
 *      - name: password
 *        in: body
 *        description: Password of our user
 *        required: true
 *        type: string
 *      - name: avatar
 *        in: file
 *        description: Image of our user
 *        required: false
 *        type: file
 *        schema:
 *          type: file
 *          format: file
 *    responses:
 *      '200':
 *        description: Successfully created user
 *    security:
 *     - api_key: []
 */
/**
 * @swagger
 * /login:
 *  post:
 *    tags: [User sign in]
 *    description: Use to login
 *    parameters:
 *      - name: email
 *        in: body
 *        description: Email of our user
 *        required: true
 *        schema:
 *          type: string
 *          format: email
 *      - name: password
 *        in: body
 *        description: Password of our user
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: Successfully logged in
 *    security:
 *     - api_key: []
 */
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
