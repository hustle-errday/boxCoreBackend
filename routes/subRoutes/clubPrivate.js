const express = require("express");
const router = express.Router();
const {
  joinClub,
  quitClub,
  kickFromClub,
  getRequests,
  acceptRequest,
} = require("../../controller/club");
const { query, body } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/join")
  .post(body("clubId").isString().notEmpty(), requestDataValidation, joinClub);
router.route("/quit").post(quitClub);
router
  .route("/kick")
  .post(
    body("userId").isString().notEmpty(),
    requestDataValidation,
    kickFromClub
  );
router.route("/requests").get(getRequests);
router
  .route("/accept")
  .post(
    body("userId").isString().notEmpty(),
    requestDataValidation,
    acceptRequest
  );

module.exports = router;
