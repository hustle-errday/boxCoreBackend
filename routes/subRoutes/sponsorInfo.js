const express = require("express");
const router = express.Router();
const { getInformation } = require("../../controller/information");
const { getSponsors } = require("../../controller/sponsor");
const { getVideos } = require("../../controller/video");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router.route("/info").get(requestDataValidation, getInformation);
router.route("/sponsors").get(requestDataValidation, getSponsors);
router.route("/videos").get(requestDataValidation, getVideos);

module.exports = router;
