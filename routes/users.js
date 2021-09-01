const express = require('express');
const router = express.Router();
const RateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const upload = require('../services/fileUpload');

const limiter = new RateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: {
    code: 429,
    message: "Շատ հարցումներ, փորձեք կրկին 15 րոպեից:"
  }
});

const SpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: 500,
  maxDelayMs: 20000,
});

const apiKeys = new Map();
apiKeys.set(process.env.API_KEY, true);

const xApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-KEY');
  if (apiKeys.has(apiKey)){
    next();
  } else{
    const error = new Error('Invalid API KEY');
    next(error);
  }
}

const fileUpload = upload({
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
}).single('avatar');

// Controllers
const UsersController = require('../controllers/UsersController');

//GET
router.get('/all_users', xApiKey, UsersController.allUsers);

//POST
router.post('/register', limiter, SpeedLimiter, fileUpload, xApiKey, UsersController.register);
router.post('/login', limiter, SpeedLimiter, xApiKey, UsersController.login);
router.post('/reset_token', limiter, SpeedLimiter, xApiKey, UsersController.reset_token);

module.exports = router;
