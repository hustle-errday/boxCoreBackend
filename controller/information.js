const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getInformation = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Information'] 
  #swagger.summary = 'Get information'
  #swagger.description = 'Get all information'
  */

  const information = await models.information.find({}, { __v: 0 }).lean();

  res.status(200).json({
    success: true,
    data: information,
  });
});
