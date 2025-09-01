const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getVideos = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Video']
  #swagger.summary = 'Get videos'
  #swagger.description = 'Get all videos'
  */

  const videos = await models.video.find({}, { __v: 0 }).lean();

  res.status(200).json({
    success: true,
    data: videos,
  });
});
