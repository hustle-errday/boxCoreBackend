const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const jwt = require("jsonwebtoken");

exports.setPersonalInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Set personal info'
  #swagger.description = 'Set personal info'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Personal info',
    schema: { 
      phoneNo: '94288008',
      firstName: 'Dodo',
      lastName: 'Anujin',
      registrationNumber: "FA01234567",
      sex: "male/female",
      birthDate: '1996-02-17',
      height: 170,
      weight: 70,
      imageUrl: 'url'
    }
  }
  */

  const {
    phoneNo,
    firstName,
    lastName,
    registrationNumber,
    sex,
    birthDate,
    height,
    weight,
    imageUrl,
  } = req.body;
  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findOne({ _id: token._id, isActive: true });
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  user.phoneNo = phoneNo;
  user.firstName = firstName;
  user.lastName = lastName;
  user.registrationNumber = registrationNumber;
  user.sex = sex;
  user.birthDate = birthDate;
  user.height = height;
  user.weight = weight;
  user.imageUrl = imageUrl;

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getPersonalInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Get personal info'
  #swagger.description = 'Get personal info'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user
    .findOne({ _id: token._id }, { __v: 0, password: 0 })
    .populate("club", "name")
    .lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  user.club ? user.club.name : "";

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getClubInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Get club info'
  #swagger.description = 'Get club info'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findOne({ _id: token._id }).lean();

  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }
  if (!user.club) {
    throw new myError("Та хараахан клубд элсээгүй байна.", 400);
  }

  const [theClub, theClubMembers, theCoach] = await Promise.all([
    models.club
      .findOne({ _id: user.club }, { createdBy: 0, __v: 0, coach: 0 })
      .lean(),
    models.user
      .find(
        { club: user.club, role: "athlete", isActive: true },
        { phoneNo: 1, firstName: 1, lastName: 1, imageUrl: 1 }
      )
      .lean(),
    models.user
      .find(
        { club: user.club, role: "coach", isActive: true },
        { phoneNo: 1, firstName: 1, lastName: 1, imageUrl: 1 }
      )
      .lean(),
  ]);

  if (!theClub) {
    throw new myError("Клуб олдсонгүй.", 400);
  }

  const club = {
    ...theClub,
    members: theClubMembers,
    coach: theCoach,
  };

  res.status(200).json({
    success: true,
    data: club,
  });
});

exports.deleteAccount = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Delete account'
  #swagger.description = 'Delete account'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const theUser = await models.user.findOne({ _id: token._id });
  if (!theUser) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  theUser.isActive = false;
  await theUser.save();

  res.status(200).json({
    success: true,
  });
});

exports.reActivateAccount = asyncHandler(async (req, res, next) => {
  /*
  #swagger.summary = 'Re-activate account'
  #swagger.description = 'Re-activate account'
  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Re-activate account',
    schema: { 
      phoneNo: '94288008'
    }
  }
  */

  const { phoneNo } = req.body;

  const theUser = await models.user.findOne({ phoneNo: phoneNo });
  if (!theUser) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  theUser.isActive = true;
  await theUser.save();

  res.status(200).json({
    success: true,
  });
});
