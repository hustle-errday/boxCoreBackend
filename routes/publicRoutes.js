// some public routes
const express = require("express");
const router = express.Router();

const competitionRoutes = require("./subRoutes/competition");
const typeRoutes = require("./subRoutes/type");
const clubRoutes = require("./subRoutes/club");

router.use("/competition", competitionRoutes);
router.use("/type", typeRoutes);
router.use("/club", clubRoutes);

module.exports = router;
