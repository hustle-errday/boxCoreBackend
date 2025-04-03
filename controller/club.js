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

  const [club, clubMembers] = await Promise.all([
    models.club
      .findById({ _id: _id }, { __v: 0, createdBy: 0 })
      .populate("coach", "firstName lastName imageUrl")
      .lean(),
    models.user
      .find(
        { club: _id, role: "athlete", isActive: true },
        { __v: 0, password: 0 }
      )
      .countDocuments(),
  ]);

  if (!club) {
    throw new myError("Клуб олдсонгүй", 400);
  }

  if (club.coach && club.coach.length > 0) {
    club.coach.forEach((item) => {
      item.name = `${item.firstName} ${item.lastName}`;
      item.imageUrl = item.imageUrl;

      delete item.firstName;
      delete item.lastName;
      delete item._id;
    });
  }

  club.memberCount = clubMembers;

  res.status(200).json({
    success: true,
    data: club,
  });
});

exports.joinClub = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Join club'
  #swagger.description = 'Join club'
  #swagger.parameters['body'] = { 
    in: 'body',
    required: true,  
    schema: { clubId: '5f1f0e7b1c9d440000d7e6f0' }
  }
  */

  const { clubId } = req.body;

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findById(token._id).lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (user.role != "athlete") {
    throw new myError("Та тамирчин байх шаардлагатай.", 400);
  }
  if (user.club) {
    throw new myError("Та аль хэдийн клуб-д орсон байна.", 400);
  }

  const club = await models.club.findById(clubId).lean();
  if (!club) {
    throw new myError("Клуб олдсонгүй", 400);
  }

  const clubLog = await models.clubLog
    .findOne({
      userId: token._id,
    })
    .sort({ _id: -1 })
    .lean();
  if (clubLog || clubLog.action == "join") {
    throw new myError("Та аль хэдийн клуб-д орсон байна.", 400);
  }

  await models.user.findByIdAndUpdate(token._id, { club: clubId });
  await models.clubLog.create({
    clubId: clubId,
    userId: token._id,
    joinAs: "athlete",
    action: "join",
  });

  res.status(200).json({
    success: true,
    data: "Хүсэлт илгээлээ.",
  });
});

exports.quitClub = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Quit club'
  #swagger.description = 'Quit club'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findById(token._id);
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (user.role != "athlete") {
    throw new myError("Та тамирчин байх шаардлагатай.", 400);
  }
  if (!user.club) {
    throw new myError("Та клуб-д байхгүй байна.", 400);
  }

  const club = await models.club.findById(user.club).lean();
  if (!club) {
    throw new myError("Клуб олдсонгүй", 400);
  }

  const clubLog = await models.clubLog
    .findOne({
      clubId: user.club,
      userId: token._id,
    })
    .sort({ _id: -1 })
    .lean();
  if (!clubLog || clubLog.action != "join") {
    throw new myError("Та клуб-д байхгүй байна.", 400);
  }

  await models.user.findByIdAndUpdate(token._id, { club: null });
  await models.clubLog.create({
    clubId: user.club,
    userId: token._id,
    joinAs: "athlete",
    action: "leave",
  });

  res.status(200).json({
    success: true,
    data: "Хүсэлт илгээлээ.",
  });
});

exports.kickFromClub = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Kick from club'
  #swagger.description = 'Kick from club'
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,  
    schema: { 
      userId: '5f1f0e7b1c9d440000d7e6f0' 
    }
  }
  */
  // club iin dasgaljuugach l hasj chadna
  // user iin club dotor token._id bnuu shalga
});

// @unused
exports.getRequests = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Get requests'
  #swagger.description = 'Get requests'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findById(token._id).lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (user.role != "coach") {
    throw new myError("Та багш байх шаардлагатай.", 400);
  }
  if (!user.club) {
    throw new myError("Та клубд элсээгүй байна.", 400);
  }

  const requests = await models.clubLog
    .find(
      {
        clubId: user.club,
        action: { $regex: /pending/ },
      },
      { __v: 0 }
    )
    .populate("userId", "firstName lastName imageUrl")
    .lean();

  for (let i = 0; i < requests.length; i++) {
    requests[
      i
    ].username = `${requests[i].userId.firstName} ${requests[i].userId.lastName}`;
    requests[i].imageUrl = requests[i].userId.imageUrl;
    requests[i].userId = requests[i].userId._id;
  }

  res.status(200).json({
    success: true,
    data: requests,
  });
});

// @unused
exports.acceptRequest = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Accept request'
  #swagger.description = 'Accept request'
  #swagger.parameters['body'] = { 
    in: 'body',
    required: true,  
    schema: { userId: '5f1f0e7b1c9d440000d7e6f0' }
  }
  */

  const { userId } = req.body;

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findById(token._id).lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (user.role != "coach") {
    throw new myError("Та багш байх шаардлагатай.", 400);
  }
  if (!user.club) {
    throw new myError("Та клубд элсээгүй байна.", 400);
  }

  const athlete = await models.user.findById(userId).lean();
  if (!athlete) {
    throw new myError("Тамирчин олдсонгүй", 400);
  }
  if (athlete.role != "athlete") {
    throw new myError("Клубд элсэхийн тулд тамирчин байх шаардлагатай.", 400);
  }

  const club = await models.club.findById(user.club).lean();
  if (!club) {
    throw new myError("Клуб олдсонгүй", 400);
  }

  const clubLog = await models.clubLog
    .findOne({
      clubId: user.club,
      userId: userId,
      action: { $regex: /pending/ },
    })
    .sort({ _id: -1 })
    .lean();

  if (!clubLog) {
    throw new myError("Хүсэлт олдсонгүй", 400);
  }

  if (clubLog.action == "pending/join") {
    await models.user.findByIdAndUpdate(userId, { club: user.club });
    await models.clubLog.findByIdAndUpdate(clubLog._id, { action: "join" });
  }
  if (clubLog.action == "pending/quit") {
    await models.user.findByIdAndUpdate(userId, { club: null });
    await models.clubLog.findByIdAndUpdate(clubLog._id, { action: "leave" });
  }

  res.status(200).json({
    success: true,
    data: "Амжилттай.",
  });
});
