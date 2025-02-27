const express = require("express");
const router = express.Router();
const { getTypes } = require("../../controller/type");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router.route("/types").get(getTypes);

module.exports = router;
