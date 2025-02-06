const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.signUp = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Auth']
  #swagger.summary = 'Sign up'
  #swagger.description = 'Sign up with phone number and password'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Sign up data',
    required: true,
    schema: { 
      phoneNo: '94288008',
      password: 'password' 
    }
  }
  */

  const { phoneNo, password } = req.body;

  res.status(200).json({
    success: true,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Auth']
  #swagger.summary = 'Login'
  #swagger.description = 'Login with phone number and password'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Login data',
    required: true,
    schema: { 
      phoneNo: '94288008',
      password: 'password' 
    }
  }
  */

  const { phoneNo, password } = req.body;

  res.status(200).json({
    success: true,
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {});

exports.authenticate = asyncHandler(async (req, res, next) => {});

exports.resetPassword = asyncHandler(async (req, res, next) => {});
