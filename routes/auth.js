const express = require("express");
const router = express.Router();

const authRoutes = require("./subRoutes/auth");
const coachRoutes = require("./subRoutes/coachAuth");

router.use("/", authRoutes);
router.use("/coach", coachRoutes);

module.exports = router;
