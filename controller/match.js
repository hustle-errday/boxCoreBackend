const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");

exports.getMatches = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Match']
  #swagger.summary = 'Get all matches'
  #swagger.description = 'Get all matches'
  #swagger.parameters['competitionId'] = { competitionId: "aaanhn" }
  */

  const { competitionId } = req.query;

  const theCompetition = await models.competition
    .findById({ _id: competitionId })
    .lean();
  if (!theCompetition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }

  const data = [];

  for (let i = 0; i < theCompetition.categories.length; i++) {
    const theCategory = await models.category
      .findById(theCompetition.categories[i])
      .lean();

    if (!theCategory) {
      throw new myError("Ангилал олдсонгүй", 400);
    }

    const theMatches = await models.match
      .find({ competitionId, categoryId: theCategory._id })
      .populate("categoryId", "name")
      .populate("playerOne", "firstName lastName imageUrl")
      .populate("playerTwo", "firstName lastName imageUrl")
      .sort({ round: 1, matchNumber: 1 })
      .lean();

    const maxRound = Math.max(...theMatches.map((match) => match.round));

    const formattedData = theMatches.reduce((acc, match) => {
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
        // @todo score
        winner: match.winner ?? "",
        matchDateTime: match.matchDateTime ?? "",
      });
      return acc;
    }, []);

    data.push({
      category: theCategory.name,
      data: formattedData,
    });
  }

  res.status(200).json({
    success: true,
    data: data,
  });
});
