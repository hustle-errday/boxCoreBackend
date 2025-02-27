const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const jwt = require("jsonwebtoken");

exports.getClubs = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Get clubs'
  #swagger.description = 'Get clubs'
  */

  const clubs = await models.club
    .find({}, { logo: 1, name: 1, description: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: clubs,
  });
});

exports.getClubDetail = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Get club detail'
  #swagger.description = 'Get club detail'
  #swagger.parameters['_id'] = { _id: '5f1f0e7b1c9d440000d7e6f0' }
  */

  const { _id } = req.query;

  const club = await models.club
    .findById({ _id: _id }, { __v: 0, createdBy: 0 })
    .populate("coach", "firstName lastName")
    .lean();

  if (!club) {
    throw new myError("Клуб олдсонгүй", 400);
  }

  club.coach = club.coach.map((item) => `${item.firstName} ${item.lastName}`);

  res.status(200).json({
    success: true,
    data: club,
  });
});

// club t oroh huselt
// club ees garah huselt
