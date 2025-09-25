const express = require("express");
const router = express.Router();
const {
  getCompetitions,
  getCompetitionDetail,
  getUniqueCompetition,
  getAllParticipants,
} = require("../../controller/competition");
const { reActivateAccount } = require("../../controller/personal");
const { getUserInfo } = require("../../controller/personal");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/")
  .get(
    query("typeId").isMongoId().notEmpty(),
    requestDataValidation,
    getCompetitions
  );
router
  .route("/detail")
  .get(
    query("_id").isMongoId().notEmpty(),
    requestDataValidation,
    getCompetitionDetail
  );
router.route("/unique").get(getUniqueCompetition);
router
  .route("/activate")
  .put(
    body("phoneNo").isString().notEmpty(),
    requestDataValidation,
    reActivateAccount
  );
router
  .route("/participants")
  .get(
    query("competitionId").isMongoId().notEmpty(),
    requestDataValidation,
    getAllParticipants
  );
router
  .route("/user")
  .get(
    query("userId").isMongoId().notEmpty(),
    requestDataValidation,
    getUserInfo
  );

module.exports = router;
