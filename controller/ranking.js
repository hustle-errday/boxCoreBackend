const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getRankingCategories = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Ranking']
  #swagger.summary = 'Get categories for ranking'
  #swagger.description = 'Get categories for ranking'
  #swagger.parameters['typeId'] = { typeId: "aaanhn" }
  #swagger.parameters['sex'] = { sex: "male or female" }
  */

  const { typeId, sex } = req.query;

  const categoryList = await models.category
    .find({ typeId: typeId, sex: sex }, { __v: 0, typeId: 0, createdBy: 0 })
    .sort({ _id: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: categoryList,
  });
});

exports.getRankingList = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Ranking']
  #swagger.summary = 'Get ranking list'
  #swagger.description = 'Get ranking list'
  #swagger.parameters['categoryId'] = { categoryId: "aaanhn" }
  */

  const { categoryId } = req.query;

  const theCategory = await models.category
    .findById({ _id: categoryId }, { name: 1 })
    .lean();
  if (!theCategory) {
    throw new myError("Ангилал байхгүй байна", 400);
  }

  const rankings = await models.ranking
    .find(
      { categoryId: theCategory._id },
      { userId: 1, place: 1, score: 1, move: 1, moveBy: 1, categoryId: 1 }
    )
    .populate({
      path: "userId",
      select: "firstName lastName imageUrl club",
      populate: {
        path: "club",
        select: "name logo",
      },
    })
    .sort({ place: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: rankings,
  });
});

exports.getUserDetail = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Ranking']
  #swagger.summary = 'Get ranking list'
  #swagger.description = 'Get ranking list'
  #swagger.parameters['userId'] = {
    in: 'query',
    description: 'userId',
    required: true,
    type: 'string'
  }
  */

  const { userId } = req.query;

  const theRank = await models.ranking
    .find({ userId }, { place: 1, move: 1, moveBy: 1, categoryId: 1, score: 1 })
    .populate("categoryId", "name")
    .lean();

  const currentRank = await models.ranking
    .findOne({ userId }, { __v: 0, createdAt: 0, updatedScore: 0 })
    .populate({
      path: "userId",
      select: "-__v -createdAt -password -role -registrationNumber -password",
      populate: {
        path: "club",
        select: "name logo",
      },
    })
    .lean();

  if (!theRank || theRank.length === 0) {
    throw new myError("Дэлгэрэнгүй мэдээлэл олдсонгүй.", 400);
  }

  const [rankingActivities, participant] = await Promise.all([
    models.rankingActivity.find({ userId }).sort({ _id: -1 }).lean(),
    models.participant
      .find({ userId }, { __v: 0, createdAt: 0 })
      .populate({
        path: "categoryId",
        select: "name typeId",
        populate: {
          path: "typeId",
          select: "name",
        },
      })

      .sort({ _id: -1 })
      .lean(),
  ]);

  const data = [];
  let goldenMedals = 0;
  let silverMedals = 0;
  let bronzeMedals = 0;
  let losses = 0;
  let wins = 0;
  let ko = 0;
  for (const activity of rankingActivities) {
    if (activity.score === 10) goldenMedals++;
    else if (activity.score === 5) silverMedals++;
    else if (activity.score === 2) bronzeMedals++;
  }
  for (const part of participant) {
    const matches = await models.match
      .find({
        $and: [
          {
            $or: [{ playerOne: part._id }, { playerTwo: part._id }],
          },
          { winner: { $exists: true } },
        ],
      })
      .populate("competitionId", "name")
      .populate("playerOne", "userId")
      .populate("playerTwo", "userId")
      .sort({ _id: -1 })
      .lean();

    for (const match of matches) {
      if (match.playerOne && match.playerTwo) {
        const isWin = match.winner.toString() === part._id.toString();
        if (isWin) wins++;
        else losses++;

        // K.O. count
        if (match.score?.[part._id]) {
          for (const round of Object.values(match.score[part._id])) {
            for (const entry of Object.values(round)) {
              if (entry?.score === "K.O.") ko++;
            }
          }
        }

        // find competitor from user model
        const isPlayerOneMe =
          match.playerOne._id?.toString() === part._id.toString();
        const opponent = isPlayerOneMe ? match.playerTwo : match.playerOne;
        let opponentUser = null;

        if (opponent?.userId) {
          opponentUser = await models.user
            .findById(opponent.userId, "firstName lastName imageUrl")
            .lean();
        }

        // store match detail per participant
        data.push({
          matchId: match._id,
          date: match.matchDateTime,
          isWin: isWin,
          isKO: ko > 0,
          competition: match.competitionId?.name ?? "Тодорхойгүй",
          category: part.categoryId?.name ?? "Тодорхойгүй",
          type: part.categoryId?.typeId?.name ?? "Тодорхойгүй",
          opponent: opponentUser,
        });
      }
    }
  }

  const rankList = theRank.map((r) => ({
    categoryName: r.categoryId?.name || "Тодорхойгүй",
    place: r.place,
    move: r.move,
    moveBy: r.moveBy,
    score: r.score,
  }));

  const userInfo = {
    ...currentRank.userId,
    goldenMedals,
    silverMedals,
    bronzeMedals,
    wins,
    losses,
    ko,
    ranks: rankList,
  };

  res.status(200).json({
    success: true,
    data: {
      user: userInfo,
      matches: data,
    },
  });
});
