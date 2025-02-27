const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getTypes = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Type']
  #swagger.summary = 'Get all types'
  #swagger.description = 'Get all types'
  */

  const types = await models.type
    .find({}, { _id: 1, name: 1 })
    .sort({ _id: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: types,
  });
});
