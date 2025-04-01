const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getMatches = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Match']
  #swagger.summary = 'Get all matches'
  #swagger.description = 'Get all matches'
  #swagger.parameters['competitionId'] = { competitionId: "aaanhn" }
  #swagger.parameters['categoryId'] = { categoryId: "aaanhn" }
  */

  const { competitionId, categoryId } = req.query;

  const theCompetition = await models.competition
    .findById({ _id: competitionId })
    .lean();
  if (!theCompetition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }

  const theCategory = await models.category.findById(categoryId).lean();
  if (!theCategory) {
    throw new myError("Ангилал олдсонгүй", 400);
  }

  const theMatches = await models.match
    .find({ competitionId, categoryId })
    .populate("categoryId", "name")
    .populate({
      path: "playerOne",
      populate: {
        path: "userId",
        model: "user",
      },
    })
    .populate({
      path: "playerTwo",
      populate: {
        path: "userId",
        model: "user",
      },
    })
    .populate({
      path: "winner",
      populate: {
        path: "userId",
        model: "user",
      },
    })
    .sort({ round: 1, matchNumber: 1 })
    .lean();

  const maxRound = Math.max(...theMatches.map((match) => match.round));

  const formattedData = theMatches.reduce((acc, match) => {
    match.playerOne = match.playerOne
      ? {
          _id: match.playerOne._id,
          firstName: match.playerOne.userId.firstName,
          lastName: match.playerOne.userId.lastName,
          imageUrl: match.playerOne.userId.imageUrl ?? "",
        }
      : null;
    match.playerTwo = match.playerTwo
      ? {
          _id: match.playerTwo._id,
          firstName: match.playerTwo.userId.firstName,
          lastName: match.playerTwo.userId.lastName,
          imageUrl: match.playerTwo.userId.imageUrl ?? "",
        }
      : null;
    match.winner = match.winner
      ? {
          _id: match.winner._id,
          firstName: match.winner.userId.firstName,
          lastName: match.winner.userId.lastName,
          imageUrl: match.winner.userId.imageUrl ?? "",
        }
      : null;

    const round = match.round === maxRound ? "Final" : `Round ${match.round}`;

    let roundObj = acc.find((r) => r.round === round);
    if (!roundObj) {
      roundObj = { round, matches: [] };
      acc.push(roundObj);
    }

    roundObj.matches.push({
      _id: match._id,
      match: match.matchNumber.toString(),
      players: [match.playerOne, match.playerTwo],
      score: match.score ?? "",
      winner: match.winner ?? "",
      matchDateTime: match.matchDateTime ?? "",
    });
    return acc;
  }, []);

  res.status(200).json({
    success: true,
    data: formattedData,
  });
});
