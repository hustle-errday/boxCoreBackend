const express = require("express");
const router = express.Router();
const { getMatches } = require("../../controller/match");
const { query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/")
  .get(query("competitionId"), requestDataValidation, getMatches);

module.exports = router;
