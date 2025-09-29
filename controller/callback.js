const asyncHandler = require("../middleware/asyncHandler");
const myError = require("../utility/myError");
const models = require("../models/models");
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");

exports.qPayCallback = asyncHandler(async (req, res, next) => {
  /*
  #swagger.tags = ['Callback']
  #swagger.summary = 'QPay callback'
  #swagger.description = 'QPay callback'
  #swagger.parameters["qpay_payment_id"] = {
    in:"query",
    type:"string",
    description:"payment id",
    default:"746624676496026"
  }
  */

  const { qpay_payment_id } = req.query;

  console.log("--------------QPay req", req);
  console.log("QPay callback", qpay_payment_id);

  res.status(200).json({
    success: true,
  });
});
