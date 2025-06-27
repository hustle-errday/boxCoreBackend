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

  const clubIds = clubs.map((club) => club._id);

  // find all users in those clubs
  const users = await models.user
    .find({ club: { $in: clubIds } }, { _id: 1, club: 1 })
    .lean();

  const userIds = users.map((u) => u._id);

  // map userId -> clubId
  const userClubMap = {};
  for (const u of users) {
    userClubMap[u._id.toString()] = u.club.toString();
  }

  // find all ranking activities for those users
  const activities = await models.rankingActivity
    .find({ userId: { $in: userIds } }, { userId: 1, score: 1 })
    .lean();

  // aggregate scores per club
  const clubScoreMap = {};
  for (const act of activities) {
    const clubId = userClubMap[act.userId.toString()];
    if (!clubScoreMap[clubId]) clubScoreMap[clubId] = 0;
    clubScoreMap[clubId] += act.score ?? 0;
  }

  // build final output
  const data = clubs.map((club) => ({
    _id: club._id,
    name: club.name,
    logo: club.logo,
    description: club.description,
    totalScore: clubScoreMap[club._id.toString()] || 0,
  }));

  data.sort((a, b) => b.totalScore - a.totalScore);

  res.status(200).json({
    success: true,
    data: data,
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
      .lean(),
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

  club.memberCount = clubMembers.length;
  club.members = clubMembers;

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
  if (clubLog && clubLog.action == "join") {
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

  const { userId } = req.body;

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const theUser = await models.user
    .findOne({ _id: userId, role: "athlete" })
    .lean();
  if (!theUser) {
    throw new myError("Тамирчин олдсонгүй", 400);
  }
  if (!theUser.club) {
    throw new myError("Тамирчин клубд элсээгүй байна", 400);
  }

  const coach = await models.user.findById(token._id).lean();
  if (!coach) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (coach.role != "coach") {
    throw new myError("Та багш байх шаардлагатай.", 400);
  }
  if (!coach.club) {
    throw new myError("Та клубд элсээгүй байна.", 400);
  }

  const club = await models.club.findById(coach.club).lean();
  if (!club) {
    throw new myError("Дасгалжуулагчийн клуб олдсонгүй", 400);
  }

  const userClub = await models.club.findById(theUser.club).lean();
  if (!userClub) {
    throw new myError("Тамирчны клуб олдсонгүй", 400);
  }

  if (userClub._id.toString() != club._id.toString()) {
    throw new myError("Та энэ тамирчны клубд дасгалжуулагч биш байна.", 400);
  }

  const clubLog = await models.clubLog
    .findOne({
      clubId: theUser.club,
      userId: userId,
    })
    .sort({ _id: -1 })
    .lean();
  if (!clubLog || clubLog.action != "join") {
    throw new myError("Тамирчин клубд элсээгүй байна", 400);
  }

  await models.user.findByIdAndUpdate(userId, { club: null });
  await models.clubLog.create({
    clubId: theUser.club,
    userId: userId,
    joinAs: "athlete",
    action: "kick",
  });

  res.status(200).json({
    success: true,
    data: "Тамирчныг клубнаас хаслаа.",
  });
});

exports.getClubRankingDetail = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Club']
  #swagger.summary = 'Get club ranking details'
  #swagger.description = 'Get club ranking details'
  #swagger.parameters['_id'] = {
    in: 'query',
    description: 'Club ID',
    required: true,
    type: 'string'
  }
  */

  const { _id } = req.query;

  const theClub = await models.club
    .findById({ _id: _id }, { createdBy: 0, createdAt: 0, __v: 0, coach: 0 })
    .lean();

  if (!theClub) {
    throw new myError("Клуб олдсонгүй.", 400);
  }

  const members = await models.user.find({ club: theClub._id }).lean();
  const userIds = members.map((u) => u._id);

  const participants = await models.participant
    .find({ userId: { $in: userIds }, status: "approved" })
    .populate("competitionId", "name")
    .lean();

  let totalWins = 0;
  let totalLosses = 0;
  let totalScore = 0;
  let totalGolden = 0;
  let totalSilver = 0;
  let totalBronze = 0;

  const compMap = {};
  for (const part of participants) {
    const comp = part.competitionId;
    if (!comp) continue;

    // init if new competition
    if (!compMap[comp._id.toString()]) {
      compMap[comp._id.toString()] = {
        name: comp.name,
        participantCount: 0,
        totalScore: 0,
        medals: {
          golden: 0,
          silver: 0,
          bronze: 0,
        },
      };
    }

    // count this participant
    compMap[comp._id.toString()].participantCount++;

    // get scores from rankingActivity
    const activities = await models.rankingActivity
      .find({ userId: part.userId })
      .lean();

    const matches = await models.match
      .find({
        $or: [{ playerOne: part._id }, { playerTwo: part._id }],
        winner: { $exists: true },
      })
      .lean();

    for (const match of matches) {
      if (match.winner.toString() === part._id.toString()) {
        totalWins++;
      } else {
        totalLosses++;
      }
    }

    for (const act of activities) {
      compMap[comp._id.toString()].totalScore += act.score;
      totalScore += act.score;

      // count medals
      if (act.score === 10) {
        compMap[comp._id.toString()].medals.golden++;
        totalGolden++;
      } else if (act.score === 5) {
        compMap[comp._id.toString()].medals.silver++;
        totalSilver++;
      } else if (act.score === 2) {
        compMap[comp._id.toString()].medals.bronze++;
        totalBronze++;
      }
    }
  }

  const competitions = Object.values(compMap);

  res.status(200).json({
    success: true,
    data: {
      club: theClub,
      totalScore,
      stats: {
        wins: totalWins,
        losses: totalLosses,
      },
      medals: {
        golden: totalGolden,
        silver: totalSilver,
        bronze: totalBronze,
      },
      competitions,
    },
  });
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
