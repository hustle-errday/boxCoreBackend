const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getSponsors = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Sponsor'] 
  #swagger.summary = 'Get sponsors'
  #swagger.description = 'Get all sponsors'
  */

  const sponsors = await models.sponsor.find({}, { __v: 0 }).lean();

  res.status(200).json({
    success: true,
    data: sponsors,
  });
});
