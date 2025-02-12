const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const jwt = require("jsonwebtoken");

exports.signUp = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Coach auth']
  #swagger.summary = 'Sign up'
  #swagger.description = 'Sign up with phone number and password'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Sign up data',
    required: true,
    schema: { 
      phoneNo: '94288008',
      firstName: 'Dodo',
      lastName: 'Anujin',
      password: 'qwer123@' 
    }
  }
  */

  const { phoneNo, firstName, lastName, password } = req.body;

  const checkUser = await models.coach.findOne({ phoneNo: phoneNo }).lean();
  if (checkUser) {
    throw new myError("Бүртгэлтэй хэрэглэгч байна.", 400);
  }

  const userCreation = await models.coach.create({
    phoneNo,
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
  #swagger.tags = ['Coach auth']
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
    throw new myError("Утасны дугаар эсвэл нууц үгээ оруулна уу.", 400);
  }

  const user = await models.coach.findOne({ phoneNo });
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 404);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new myError("Нууц үг буруу байна.", 400);
  }

  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();

  res.status(200).json({
    success: true,
    accessToken,
    refreshToken,
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Coach auth']
  #swagger.summary = 'Refresh token'
  #swagger.description = 'Refresh token with refresh token'
  #swagger.parameters['refreshToken'] = {
    in: 'query',
    required: true,
  }
  */

  const { refreshToken } = req.body;

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, user) => {
    if (err) {
      throw new myError("Токен хүчингүй байна.", 400);
    }

    const theCoach = await models.coach.findOne(user._id);
    if (!theCoach) {
      throw new myError("Хэрэглэгч олдсонгүй.", 400);
    }

    const accessToken = theCoach.getAccessToken();
    const newRefreshToken = theCoach.getRefreshToken();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  });
});

exports.authenticate = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Coach auth']
  #swagger.summary = 'Authenticate'
  #swagger.description = 'Authenticate user with access token'
  #swagger.parameters['accessToken'] = {
    in: 'query',
    required: true,
  }
  */

  const { accessToken } = req.body;

  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      throw new myError("Токен хүчингүй байна.", 400);
    }

    res.status(200).json({
      success: true,
      user,
    });
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Coach auth']
  #swagger.summary = 'Reset password'
  #swagger.description = 'Reset password with phone number'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Reset password data',
    required: true,
    schema: { 
      phoneNo: '94288008',
      password: 'password' 
    }
  }
  */

  const { phoneNo, password } = req.body;

  const user = await models.coach.findOne({ phoneNo });
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 404);
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
  });
});
