const mongoose = require("mongoose");
const moment = require("moment-timezone");

const competitionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  startDate: {
    type: String,
    trim: true,
    required: true,
  },
  endDate: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
  registrationStartDate: {
    type: String,
    trim: true,
    required: true,
  },
  registrationEndDate: {
    type: String,
    trim: true,
    required: true,
  },
  createdAt: {
    type: String,
    trim: true,
    default: function () {
      return moment().tz("Asia/Ulaanbaatar").format("YYYY-MM-DD HH:mm:ss");
    },
  },
});

module.exports = mongoose.model("competition", competitionSchema);
