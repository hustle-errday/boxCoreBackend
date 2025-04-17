const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const jwt = require("jsonwebtoken");

exports.getNotifToken = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Notification']
  #swagger.summary = 'Get notification token'
  #swagger.description = 'Get notification token'
  #swagger.parameters['notifToken'] = { notifToken: "token" }
  */

  const { notifToken } = req.query;

  if (!notifToken) {
    throw new myError("Токен байхгүй байна.", 400);
  }

  const token = await models.notifToken
    .findOne({ notifKey: notifToken })
    .lean();

  if (!token) {
    await models.notifToken.create({
      notifKey: notifToken,
    });

    res.status(200).json({
      success: true,
    });
  }
  if (token) {
    res.status(200).json({
      success: true,
    });
  }
});

exports.initialNotifHistory = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Notification']
  #swagger.summary = 'Get notification history'
  #swagger.description = 'Get notification history'
  */

  const token = req.headers?.authorization?.split(" ")[1] ?? null;

  // initialize an array to store all notifs
  let allNotifHistory = [];

  // public notifs (always included)
  const publicNotifs = await models.notifHistory
    .find({ notifType: "public" }, { __v: 0, admin: 0, notifType: 0 })
    .sort({ _id: -1 })
    .limit(15)
    .lean();

  allNotifHistory = [...publicNotifs];

  if (token) {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new myError("Токен байхгүй байна.", 400);
    }

    const user = await models.user.findById(decoded._id).lean();
    if (!user) {
      throw new myError("Хэрэглэгч олдсонгүй", 400);
    }

    const participant = await models.participant
      .find({ userId: user._id })
      .lean();

    for (let i = 0; i < participant.length; i++) {
      const competitionNotifs = await models.notifHistory
        .find(
          { competitionId: participant[i].competitionId },
          { __v: 0, admin: 0, notifType: 0 }
        )
        .sort({ _id: -1 })
        .limit(15)
        .lean();

      allNotifHistory = [...allNotifHistory, ...competitionNotifs];
    }
  }

  // sort and limit the combined results
  allNotifHistory.sort((a, b) => b._id - a._id);
  allNotifHistory = allNotifHistory.slice(0, 15);

  return res.status(200).json({
    success: true,
    data: allNotifHistory,
  });
});

exports.followingNotifHistory = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Notification']
  #swagger.summary = 'Get following notification history'
  #swagger.description = 'hamgiin suuliin notifiin _id'
  #swagger.parameters['_id'] = { _id: "_id" }
  */

  const { _id } = req.query;
  const token = req.headers?.authorization?.split(" ")[1] ?? null;

  let allNotifHistory = [];

  if (!token) {
    const publicNotifs = await models.notifHistory
      .find(
        { notifType: "public", _id: { $lt: _id } },
        { __v: 0, admin: 0, notifType: 0 }
      )
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    allNotifHistory = [...publicNotifs];
  }
  if (token) {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new myError("Токен байхгүй байна.", 400);
    }

    const user = await models.user.findById(decoded._id).lean();
    if (!user) {
      throw new myError("Хэрэглэгч олдсонгүй", 400);
    }

    const participant = await models.participant
      .find({ userId: user._id })
      .lean();

    for (let i = 0; i < participant.length; i++) {
      const competitionNotifs = await models.notifHistory
        .find(
          { competitionId: participant[i].competitionId, _id: { $lt: _id } },
          { __v: 0, admin: 0, notifType: 0 }
        )
        .sort({ _id: -1 })
        .limit(10)
        .lean();

      allNotifHistory = [...allNotifHistory, ...competitionNotifs];
    }
  }

  // sort and limit the combined results
  allNotifHistory.sort((a, b) => b._id - a._id);
  allNotifHistory = allNotifHistory.slice(0, 10);

  return res.status(200).json({
    success: true,
    data: allNotifHistory,
  });
});
