const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");
const {
  matchCategory,
  transformData,
} = require("../myFunctions/competitionHelper");

exports.getCompetitions = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get all competitions'
  #swagger.description = 'Get all competitions'
  #swagger.parameters['typeId'] = { typeId: "_id" }
  */

  const { typeId } = req.query;

  const competitions = await models.competition
    .find(
      { typeId: typeId },
      {
        _id: 1,
        name: 1,
        banner: 1,
        startDate: 1,
        endDate: 1,
        description: 1,
        registrationStartDate: 1,
        registrationDeadline: 1,
      }
    )
    .populate("categories", "name")
    .sort({ _id: -1 })
    .lean();

  const ongoingCompetitions = [];
  const upcomingCompetitions = [];
  const pastCompetitions = [];
  for (let i = 0; i < competitions.length; i++) {
    competitions[i].categories = competitions[i].categories.map((item) => [
      { name: item.name, _id: item._id },
    ]);

    const now = moment().tz("Asia/Ulaanbaatar").format("YYYY-MM-DD HH:mm:ss");

    const startDate = moment(competitions[i].startDate)
      .tz("Asia/Ulaanbaatar")
      .format("YYYY-MM-DD HH:mm:ss");
    // if there is no endDate then set it to 9999-12-31 23:59:59
    // means all competitions without an end date will stay in the ongoing list indefinitely
    const endDate = moment(competitions[i].endDate ?? "9999-12-31 23:59:59")
      .tz("Asia/Ulaanbaatar")
      .format("YYYY-MM-DD HH:mm:ss");

    if (moment(now).isBefore(moment(startDate))) {
      upcomingCompetitions.push(competitions[i]);
    } else if (moment(now).isAfter(moment(endDate))) {
      pastCompetitions.push(competitions[i]);
    } else {
      ongoingCompetitions.push(competitions[i]);
    }
  }

  const data = [
    { status: "now", data: ongoingCompetitions },
    { status: "soon", data: upcomingCompetitions },
    { status: "end", data: pastCompetitions },
  ];

  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.getCompetitionDetail = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get competition detail'
  #swagger.description = 'Get competition detail'
  #swagger.parameters['_id'] = { _id: '5f1f0e7b1c9d440000d7e6f0' }
  */

  const { _id } = req.query;

  const competition = await models.competition
    .findById({ _id: _id }, { __v: 0 })
    .populate("typeId", "name")
    .populate("categories", "name")
    .populate("referees", "firstName lastName")
    .lean();

  if (!competition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }

  const participants = await models.participant
    .find({ competitionId: _id })
    .populate("userId", "sex")
    .lean();

  let male = 0;
  let female = 0;
  let unknown = 0;
  for (let i = 0; i < participants.length; i++) {
    if (participants[i].userId?.sex && participants[i].userId.sex === "male") {
      male++;
    }
    if (
      participants[i].userId?.sex &&
      participants[i].userId.sex === "female"
    ) {
      female++;
    }
    if (!participants[i].userId?.sex) {
      unknown++;
    }
  }

  competition.type = competition.typeId.name;
  competition.categories = competition.categories.map((item) => ({
    name: item.name,
    _id: item._id,
  }));
  if (competition.referees) {
    competition.referees = competition.referees.map((item) => ({
      name: `${item.firstName} ${item.lastName}`,
    }));
  }
  competition.participants = {
    male: male,
    female: female,
    unknown: unknown,
  };
  delete competition.typeId;

  res.status(200).json({
    success: true,
    data: competition,
  });
});

exports.getUniqueCompetition = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get unique competitions'
  #swagger.description = 'Get unique competitions'
  */

  const theCompetition = await models.competition
    .find(
      { isUnique: true },
      {
        name: 1,
        banner: 1,
        startDate: 1,
        endDate: 1,
        registrationStartDate: 1,
        registrationDeadline: 1,
      }
    )
    .sort({ _id: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: theCompetition,
  });
});

exports.joinCompetition = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Join competition'
  #swagger.description = 'Join competition'
  #swagger.parameters['body'] = { 
    in: 'body',
    description: 'Join competition',
    required: true,
    schema: {  
      competitionId: '5f1f0e7b1c9d440000d7e6f0',
      categoryId: '5f1f0e7b1c9d440000d7e6f0'
    }
  }
  */

  const { competitionId, categoryId } = req.body;
  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const [competition, category, user, checkRegister] = await Promise.all([
    models.competition.findById(competitionId).lean(),
    models.category.findById(categoryId).lean(),
    models.user.findById(token._id),
    models.participant
      .findOne({
        competitionId: competitionId,
        userId: token._id,
      })
      .lean(),
  ]);

  if (!competition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }
  if (!category) {
    throw new myError("Ангилал олдсонгүй", 400);
  }
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (checkRegister) {
    throw new myError("Та уг тэмцээнд бүртгэлтэй байна", 400);
  }

  // register user in competition
  await models.participant.create({
    competitionId: competitionId,
    userId: token._id,
    categoryId: categoryId,
  });

  res.status(200).json({
    success: true,
    data: "Тэмцээнд амжилттай бүртгэгдлээ",
  });
});

exports.enterCompetition = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Enter competition'
  #swagger.description = 'Enter competition'
  #swagger.parameters['body'] = { 
    in: 'body',
    description: 'Join competition',
    required: true,
    schema: {  
      competitionId: '5f1f0e7b1c9d440000d7e6f0' 
    }
  }
  */

  const { competitionId } = req.body;

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);
  const now = moment().tz("Asia/Ulaanbaatar").format("YYYY-MM-DD HH:mm:ss");

  const [theCompetition, theUser] = await Promise.all([
    models.competition.findById({ _id: competitionId }).lean(),
    models.user.findById(token._id).lean(),
  ]);
  if (!theCompetition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }
  if (!theUser) {
    throw new myError("Хэрэглэгч олдсонгүй", 400);
  }
  if (theUser.role !== "athlete") {
    throw new myError("Та тамирчин байх шаардлагатай", 400);
  }

  const [categories, checkRegister] = await Promise.all([
    models.category.find({ _id: { $in: theCompetition.categories } }).lean(),
    models.participant
      .findOne({
        competitionId: competitionId,
        userId: token._id,
      })
      .lean(),
  ]);

  if (checkRegister) {
    return res.status(402).json({
      success: false,
      code: 402,
      error: "Та уг тэмцээнд бүртгэлтэй байна",
    });
  }
  if (moment(now).isBefore(moment(theCompetition.registrationStartDate))) {
    throw new myError("Тэмцээний бүртгэл хараахан эхлээгүй байна", 400);
  }
  if (moment(now).isAfter(moment(theCompetition.registrationDeadline))) {
    throw new myError("Тэмцээний бүртгэл хаагдсан байна", 400);
  }
  if (moment(now).isAfter(moment(theCompetition.startDate))) {
    throw new myError("Тэмцээн эхлэсэн тул бүртгүүлэх боломжгүй", 400);
  }
  if (moment(now).isAfter(moment(theCompetition.endDate))) {
    throw new myError("Тэмцээн дууссан байна", 400);
  }

  // find the best-matching category
  const userSex = theUser.sex;
  const userAge = moment().diff(
    moment(theUser.birthDate, "YYYY-MM-DD"),
    "years"
  );
  const userWeight = parseFloat(theUser.weight);
  const userHeight = parseFloat(theUser.height);

  // magical function to find the best-matching category
  const matchedCategory = await matchCategory(categories, {
    userSex,
    userAge,
    userWeight,
    userHeight,
  });

  if (!matchedCategory) {
    throw new myError("Танд тохирох ангилал олдсонгүй", 400);
  }

  const data = {
    userSex,
    userAge,
    userWeight,
    userHeight,
    categories: matchedCategory.map((cat) => ({
      categoryId: cat._id,
      name: cat.name,
    })),
  };

  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.getAllParticipants = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get all participants'
  #swagger.description = 'Get all participants'
  #swagger.parameters['competitionId'] = { competitionId: '5f1f0e7b1c9d440000d7e6f0' }
  */

  const { competitionId } = req.query;

  const theCompetition = await models.competition
    .findById({ _id: competitionId })
    .lean();
  if (!theCompetition) {
    throw new myError("Тэмцээн олдсонгүй", 400);
  }

  const participants = await models.participant
    .find({
      competitionId: competitionId,
    })
    .populate("userId", "firstName lastName imageUrl")
    .populate("categoryId", "name")
    .lean();

  // class by category
  const data = {};
  for (let i = 0; i < participants.length; i++) {
    const category = participants[i].categoryId.name;
    if (!data[category]) {
      data[category] = [];
    }
    data[category].push({
      name: `${participants[i].userId?.firstName ?? ""} ${
        participants[i].userId?.lastName ?? ""
      }`,
      imageUrl: participants[i].userId?.imageUrl ?? "",
    });
  }

  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.getCategoryList = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get Category List By Category'
  #swagger.description = 'Get category list by category'
  #swagger.parameters['competitionId'] = { competitionId: '60f4f2c4a4c6b80015f6f5a9' }
  */

  const { competitionId } = req.query;

  const competition = await models.competition
    .findById({ _id: competitionId })
    .lean();
  if (!competition) {
    throw new myError("Тэмцээн олдсонгүй.", 400);
  }

  const data = [];
  for (let i = 0; i < competition.categories.length; i++) {
    const category = await models.category
      .findById({ _id: competition.categories[i] })
      .lean();
    if (!category) {
      throw new myError("Тэмцээн доторх ангилал олдсонгүй.", 400);
    }

    data.push(category);
  }

  const transformedData = await transformData(data);

  res.status(200).json({
    success: true,
    data: transformedData,
  });
});
