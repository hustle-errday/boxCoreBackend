const express = require("express");
const router = express.Router();
const { getTypes } = require("../../controller/type");
const {
  initialNotifHistory,
  followingNotifHistory,
} = require("../../controller/notification");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router.route("/types").get(getTypes);
router.route("/notif").get(initialNotifHistory);
router
  .route("/notif/following")
  .get(query("_id").isString(), requestDataValidation, followingNotifHistory);

module.exports = router;
