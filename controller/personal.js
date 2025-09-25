const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");
const {
  generateQPayPayment,
  checkPayment,
} = require("../myFunctions/paymentHelper");

exports.setPersonalInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Set personal info'
  #swagger.description = 'Set personal info'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Personal info',
    schema: { 
      phoneNo: '94288008',
      firstName: 'Dodo',
      lastName: 'Anujin',
      registrationNumber: "FA01234567",
      sex: "male/female",
      birthDate: '1996-02-17',
      height: 170,
      weight: 70,
      imageUrl: 'url'
    }
  }
  */

  const {
    phoneNo,
    firstName,
    lastName,
    registrationNumber,
    sex,
    birthDate,
    height,
    weight,
    imageUrl,
  } = req.body;
  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findOne({ _id: token._id, isActive: true });
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  user.phoneNo = phoneNo;
  user.firstName = firstName;
  user.lastName = lastName;
  user.registrationNumber = registrationNumber;
  user.sex = sex;
  user.birthDate = birthDate;
  user.height = height;
  user.weight = weight;
  user.imageUrl = imageUrl;

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getPersonalInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Get personal info'
  #swagger.description = 'Get personal info'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user
    .findOne({ _id: token._id }, { __v: 0, password: 0 })
    .populate("club", "name")
    .lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  user.club ? user.club.name : "";

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getClubInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Get club info'
  #swagger.description = 'Get club info'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findOne({ _id: token._id }).lean();

  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }
  if (!user.club) {
    throw new myError("Та хараахан клубд элсээгүй байна.", 400);
  }

  const [theClub, theClubMembers, theCoach] = await Promise.all([
    models.club
      .findOne({ _id: user.club }, { createdBy: 0, __v: 0, coach: 0 })
      .lean(),
    models.user
      .find(
        { club: user.club, role: "athlete", isActive: true },
        { phoneNo: 1, firstName: 1, lastName: 1, imageUrl: 1 }
      )
      .lean(),
    models.user
      .find(
        { club: user.club, role: "coach", isActive: true },
        { phoneNo: 1, firstName: 1, lastName: 1, imageUrl: 1 }
      )
      .lean(),
  ]);

  if (!theClub) {
    throw new myError("Клуб олдсонгүй.", 400);
  }

  const club = {
    ...theClub,
    members: theClubMembers,
    coach: theCoach,
  };

  res.status(200).json({
    success: true,
    data: club,
  });
});

exports.deleteAccount = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Delete account'
  #swagger.description = 'Delete account'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const theUser = await models.user.findOne({ _id: token._id });
  if (!theUser) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  theUser.isActive = false;
  await theUser.save();

  res.status(200).json({
    success: true,
  });
});

exports.reActivateAccount = asyncHandler(async (req, res, next) => {
  /*
  #swagger.summary = 'Re-activate account'
  #swagger.description = 'Re-activate account'
  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Re-activate account',
    schema: { 
      phoneNo: '94288008'
    }
  }
  */

  const { phoneNo } = req.body;

  const theUser = await models.user.findOne({ phoneNo: phoneNo });
  if (!theUser) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  theUser.isActive = true;
  await theUser.save();

  res.status(200).json({
    success: true,
  });
});

exports.getMyCompetitions = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Get my competitions'
  #swagger.description = 'Get my competitions'
  */

  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user.findOne({ _id: token._id }).lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  const checkRegister = await models.participant
    .find({ userId: user._id })
    .populate("competitionId")
    .sort({ _id: -1 })
    .lean();

  const data = [];
  checkRegister.forEach((item) => {
    data.push({
      competitionId: item.competitionId._id,
      name: item.competitionId.name,
      startDate: item.competitionId.startDate,
      endDate: item.competitionId.endDate,
      chargePaid: item.chargePaid,
      charge: item.competitionId.charge,
      chargeDeadLine: item.competitionId.chargeDeadline,
      banner: item.competitionId.banner,
      status: item.status,
    });
  });

  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.chargePayment = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Personal']
  #swagger.summary = 'Charge payment'
  #swagger.description = 'Charge payment'
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'Charge payment',
    schema: { 
      competitionId: 'competitionId',
      total: 80000,
    }
  }
  */

  const { competitionId, total } = req.body;
  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const now = moment().tz("Asia/Ulaanbaatar").format("YYYY-MM-DD HH:mm:ss");

  const [user, theCompetition] = await Promise.all([
    models.user.findOne({ _id: token._id, isActive: true }).lean(),
    models.competition
      .findById({
        _id: competitionId,
      })
      .lean(),
  ]);
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }
  if (!theCompetition) {
    throw new myError("Тэмцээн олдсонгүй.", 400);
  }
  if (parseInt(theCompetition.charge) != parseInt(total)) {
    throw new myError("Хураамжийн үнийн дүн зөрүүтэй байна.", 400);
  }
  if (
    theCompetition.chargeDeadline &&
    moment(theCompetition.chargeDeadline).isBefore(now)
  ) {
    throw new myError("Тэмцээний хураамж төлөх хугацаа дууссан байна.", 400);
  }
  if (moment(theCompetition.startDate).isBefore(now)) {
    throw new myError("Тэмцээн эхэлсэн байна.", 400);
  }

  const participant = await models.participant
    .findOne({ userId: user._id, competitionId: competitionId })
    .lean();
  if (!participant) {
    throw new myError("Та тэмцээнд бүртгүүлээгүй байна.", 400);
  }
  if (participant.chargePaid) {
    throw new myError("Тэмцээний хураамж төлөгдсөн байна.", 400);
  }

  const invoices = await models.invoice
    .find({
      isPaid: false,
      competitionId: competitionId,
      participantId: participant._id,
    })
    .lean();
  if (invoices.length > 0) {
    await models.invoice.deleteMany({
      isPaid: false,
      competitionId: competitionId,
      participantId: participant._id,
    });
  }

  // save invoice
  const invoiceCreation = await models.invoice.create({
    competitionId: competitionId,
    participantId: participant._id,
    total: parseInt(total),
  });

  const qpayObject = {
    invoice_code: "SHURBUM_SH_INVOICE",
    sender_invoice_no: `${moment().valueOf()}`,
    invoice_receiver_code: user._id.toString(),
    invoice_description: `Тэмцээний хураамж - ${user.phoneNo}`,
    calculate_vat: false,
    amount: parseInt(total),
    callback_url: process.env.QPAY_CALLBACK_URL,
  };

  const qPayResponse = await generateQPayPayment(
    qpayObject,
    process.env.QPAY_ACCESS_TOKEN
  );

  if (!qPayResponse) {
    throw new myError("Qpay руу хандахад алдаа гарлаа", 400);
  }

  await models.invoice.findByIdAndUpdate(invoiceCreation._id, {
    invoice_id: qPayResponse.invoice_id,
    qpay: qPayResponse,
  });

  res.status(200).json({
    success: true,
    _id: invoiceCreation._id,
    data: qPayResponse,
  });
});

exports.checkPayment = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.body;
  const token = jwt.decode(req.headers.authorization.split(" ")[1]);

  const user = await models.user
    .findOne({ _id: token._id, isActive: true })
    .lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  const invoice = await models.invoice.findOne({
    _id: invoiceId,
  });
  if (!invoice) {
    throw new myError("Нэхэмжлэл олдсонгүй.", 400);
  }

  const participant = await models.participant
    .findOne({ userId: user._id, competitionId: invoice.competitionId })
    .lean();
  if (!participant) {
    throw new myError("Тэмцээний бүртгэл олдсонгүй.", 400);
  }

  const qpayObject = {
    object_type: "INVOICE",
    object_id: invoice.invoice_id,
    offset: {
      page_number: 1,
      page_limit: 100,
    },
  };

  const qPayResponse = await checkPayment(qpayObject);
  if (!qPayResponse) {
    throw new myError("Qpay руу хандахад алдаа гарлаа", 400);
  }

  if (qPayResponse.count == 0) {
    return res.status(200).json({
      success: true,
      data: "Төлбөр хийгдээгүй байна",
    });
  }
  if (qPayResponse.rows[0].payment_status == "PAID") {
    invoice.isPaid = true;
    invoice.paidAt = moment()
      .tz("Asia/Ulaanbaatar")
      .format("YYYY-MM-DD HH:mm:ss");
    await invoice.save();
    await models.participant.findByIdAndUpdate(participant._id, {
      chargePaid: true,
    });

    return res.status(200).json({
      success: true,
      data: "Төлбөр амжилттай хийгдлээ",
    });
  }
});

exports.getUserInfo = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Competition']
  #swagger.summary = 'Get personal info'
  #swagger.description = 'Get personal info'
  #swagger.parameters['userId'] = {
    in: 'query',
    description: 'userId',
    required: true,
    type: 'string'
  }
  */

  const { userId } = req.query;

  const user = await models.user
    .findOne({ _id: userId }, { __v: 0, password: 0 })
    .populate("club", "name logo")
    .lean();
  if (!user) {
    throw new myError("Хэрэглэгч олдсонгүй.", 400);
  }

  user.club ? user.club.name : "";

  res.status(200).json({
    success: true,
    data: user,
  });
});
