const express = require("express");
const router = express.Router();

const matchRoutes = require("./subRoutes/match");
const clubRoutes = require("./subRoutes/clubPrivate");
const personalRoutes = require("./subRoutes/personal");
const competitionRoutes = require("./subRoutes/competitionPrivate");

router.use("/club", clubRoutes);
router.use("/match", matchRoutes);
router.use("/personal", personalRoutes);
router.use("/competition", competitionRoutes);

module.exports = router;
