const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const jwt = require("jsonwebtoken");

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
      registrationNumber: 'FA02320509',
      firstName: 'Dodo',
      lastName: 'Anujin',
      password: 'qwer123@' 
    }
  }
  */

  const { phoneNo, registrationNumber, firstName, lastName, password } =
    req.body;

  const checkUser = await models.user
    .findOne({ phoneNo: phoneNo, isActive: true })
    .lean();
  if (checkUser) {
    throw new myError("Бүртгэлтэй хэрэглэгч байна.", 400);
  }

  const userCreation = await models.user.create({
    phoneNo,
    registrationNumber,
    firstName,
    lastName,
    password,
  });

  const accessToken = userCreation.getAccessToken();
  const refreshToken = userCreation.getRefreshToken();

  res.status(200).json({
    success: true,
    accessToken,
    refreshToken,
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

  if (!phoneNo || !password) {
    throw new myError("Нууц үг эсвэл утасны дугаар байхгүй байна.", 400);
  }

  const theUser = await models.user.findOne({
    phoneNo: phoneNo,
    isActive: true,
  });
  if (!theUser) {
    throw new myError("Бүртгэлгүй хэрэглэгч байна.", 400);
  }

  const isMatch = await theUser.matchPassword(password);
  if (!isMatch) {
    throw new myError("Нууц үг буруу байна.", 400);
  }

  const accessToken = theUser.getAccessToken();
  const refreshToken = theUser.getRefreshToken();

  res.status(200).json({
    success: true,
    accessToken,
    refreshToken,
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Auth']
  #swagger.summary = 'Refresh token'
  #swagger.description = 'Refresh access token with refresh token'
  #swagger.parameters['refreshToken'] = {
    in: 'query',
    required: true,
  }
  */

  const { refreshToken } = req.query;

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, user) => {
    if (err) {
      throw new myError("Токен хүчингүй байна.", 400);
    }

    const theUser = await models.user.findOne({
      _id: user._id,
      isActive: true,
    });
    if (!theUser) {
      throw new myError("Хэрэглэгч олдсонгүй.", 400);
    }

    const accessToken = theUser.getAccessToken();
    const refreshToken = theUser.getRefreshToken();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
    });
  });
});

exports.authenticate = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Auth']
  #swagger.summary = 'Authenticate'
  #swagger.description = 'Authenticate user'
  #swagger.parameters['authorization'] = {
    in: 'header',
    description: 'Bearer token',
    required: true,
    example: 'Bearer token'
  }
  */

  if (!req.headers.authorization) {
    throw new myError("Токен байхгүй байна.", 401);
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  if (!accessToken) {
    throw new myError("Токен байхгүй байна.", 401);
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Токен хүчингүй байна.",
      });
    }

    res.status(200).json({
      success: true,
    });
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Auth']
  #swagger.summary = 'Reset password'
  #swagger.description = 'Reset password with phone number'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Reset password data',
    required: true,
    schema: { 
      phoneNo: '94288008',
      password: 'newPassword'
    }
  }
  */

  const { phoneNo, password } = req.body;

  const theUser = await models.user.findOne({
    phoneNo: phoneNo,
    isActive: true,
  });
  if (!theUser) {
    throw new myError("Утасны дугаар буруу байна.", 400);
  }

  theUser.password = password;
  await theUser.save();

  res.status(200).json({
    success: true,
  });
});
