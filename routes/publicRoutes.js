// some public routes
const express = require("express");
const router = express.Router();

const competitionRoutes = require("./subRoutes/competition");
const sponsorRoutes = require("./subRoutes/sponsorInfo");
const rankingRoutes = require("./subRoutes/ranking");
const imageRoutes = require("./subRoutes/image");
const typeRoutes = require("./subRoutes/type");
const clubRoutes = require("./subRoutes/club");

router.use("/competition", competitionRoutes);
router.use("/ranking", rankingRoutes);
router.use("/dash", sponsorRoutes);
router.use("/image", imageRoutes);
router.use("/type", typeRoutes);
router.use("/club", clubRoutes);

module.exports = router;
