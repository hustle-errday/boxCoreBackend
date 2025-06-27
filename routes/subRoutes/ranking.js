const express = require("express");
const router = express.Router();
const {
  getRankingCategories,
  getRankingList,
  getUserDetail,
} = require("../../controller/ranking");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/categories")
  .get(
    query("typeId").isMongoId().notEmpty(),
    query("sex").isString().notEmpty(),
    requestDataValidation,
    getRankingCategories
  );
router
  .route("/list")
  .get(
    query("categoryId").isMongoId().notEmpty(),
    requestDataValidation,
    getRankingList
  );
router
  .route("/user")
  .get(
    query("userId").isMongoId().notEmpty(),
    requestDataValidation,
    getUserDetail
  );

module.exports = router;
