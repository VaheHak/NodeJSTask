const HttpError = require('http-errors');
const fs = require('fs');
const jwt = require("jsonwebtoken");
const Users = require("../models/user");
const Validate = require("../services/validate");

const {JWT_SECRET, JWT_REFRESH_SECRET} = process.env;
const refreshTokens = [];

class UsersController {

  static allUsers = async (req, res, next) => {
    try {
      await Validate(req.query, {
        page: 'required|number',
      })
      const {page = 1} = req.query;
      let pageSize = 5;

      const getPagination = (page, size) => {
        const limit = size ? +size : 5;
        const offset = page ? (page - 1) * limit : 0;

        return {limit, offset};
      };

      const getPagingData = (data, page, limit) => {
        const {count: totalItems, rows: users} = data;
        const currentPage = page ? +page : 1;
        const totalPages = Math.ceil(totalItems / limit);

        return {totalItems, users, totalPages, currentPage};
      };

      const {limit, offset} = getPagination(page, pageSize);

      await Users.findAndCountAll({
        offset: offset,
        limit: limit,
      }).then((data) => {
        const result = getPagingData(data, page, limit);
        return res.json({
          status: true,
          data: result,
        });
      }).catch((err) => {
        return res.status(500).json({
          errors: err.message,
        });
      });
    } catch (e) {
      next(e);
    }
  }

  static register = async (req, res, next) => {
    try {
      const {email, password} = req.body;
      await Validate(req.body, {
        email: 'required|email',
        password: 'required|string|minLength:8|maxLength:20',
      })
      const {file} = req;

      const uniqueEmail = await Users.findOne({where: {email}});
      if (uniqueEmail){
        res.status(422).json({errors: {email: "Այս Էլ․ փոստը արդեն գոյություն ունի"}});
        return;
      }
      const user = await Users.create({
        email, password
      });

      const fileTypes = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp'
      }

      if (file && user){
        const imageDir = `public/avatars/${ user.id }/`;
        if (!fs.existsSync(imageDir)){
          fs.mkdirSync(imageDir, {recursive: true})
        }
        const avatar = file.fieldname + '-' + Date.now() + fileTypes[file.mimetype];
        fs.writeFileSync(imageDir + avatar, file.buffer);

        user.avatar = `${ global.serverUrl }/avatars/${ user.id }/${ avatar }`;
        await user.save();
      }

      let token, refresh_token;
      if (user){
        token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '1h'});
        refresh_token = jwt.sign({userId: user.id}, JWT_REFRESH_SECRET, {expiresIn: '7d'});
        refreshTokens.push(refresh_token);
      }

      res.json({
        status: true,
        msg: 'registered',
        data: user,
        access_token: token,
        refresh_token,
      });
    } catch (e) {
      next(e);
    }
  }

  static login = async (req, res, next) => {
    try {
      await Validate(req.body, {
        email: 'required|email',
        password: 'required|string|minLength:8|maxLength:20',
      })
      const {email, password} = req.body;
      const user = await Users.findOne({
        where: {
          email,
        }
      });

      if (!user || user.getDataValue('password') !== Users.passwordHash(password)){
        throw HttpError(403, 'Invalid email or password');
      }

      const token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '1h'});
      const refresh_token = jwt.sign({userId: user.id}, JWT_REFRESH_SECRET, {expiresIn: '7d'});

      refreshTokens.push(refresh_token);
      res.json({
        status: true,
        msg: 'You are logged in',
        access_token: token,
        refresh_token,
      });
    } catch (e) {
      next(e);
    }
  }

  static reset_token = async (req, res, next) => {
    try {
      await Validate(req.body, {
        refreshToken: 'required|string',
      })
      const {refreshToken} = req.body;

      if (!refreshToken || !refreshTokens.includes(refreshToken)){
        throw HttpError(403, {errors: 'User not authenticated'});
      }

      jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, data) => {
        if (!err){
          const accessToken = jwt.sign({userId: data.id}, JWT_SECRET, {expiresIn: '1h'});
          return res.json({accessToken});
        } else{
          throw HttpError(403, {errors: 'User not authenticated'});
        }
      });
    } catch (e) {
      next(e);
    }
  }

}

module.exports = UsersController;
