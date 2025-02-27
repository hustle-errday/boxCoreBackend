const express = require("express");
const router = express.Router();
const { getClubDetail, getClubs } = require("../../controller/club");
const { query, body } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router.route("/").get(getClubs);
router
  .route("/detail")
  .get(
    query("_id").isString().notEmpty(),
    requestDataValidation,
    getClubDetail
  );

module.exports = router;
