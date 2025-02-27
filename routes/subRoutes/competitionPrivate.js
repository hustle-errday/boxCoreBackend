const express = require("express");
const router = express.Router();
const {
  enterCompetition,
  joinCompetition,
} = require("../../controller/competition");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/enter")
  .post(
    body("competitionId").isMongoId().notEmpty(),
    requestDataValidation,
    enterCompetition
  );
router
  .route("/join")
  .post(
    body("competitionId").isMongoId().notEmpty(),
    body("categoryId").isMongoId().notEmpty(),
    requestDataValidation,
    joinCompetition
  );

module.exports = router;
