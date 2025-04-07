const express = require("express");
const router = express.Router();
const { qPayCallback } = require("../controller/callback");

router.route("/qpay").get(qPayCallback);

module.exports = router;
