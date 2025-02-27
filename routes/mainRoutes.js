const express = require("express");
const router = express.Router();

const imageRoutes = require("./subRoutes/image");
const personalRoutes = require("./subRoutes/personal");
const competitionRoutes = require("./subRoutes/competitionPrivate");

router.use("/image", imageRoutes);
router.use("/personal", personalRoutes);
router.use("/competition", competitionRoutes);

module.exports = router;
