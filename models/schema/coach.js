const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const coachSchema = new mongoose.Schema({
  phoneNo: {
    type: String,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    trim: true,
    required: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "club",
  },
  role: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: String,
    trim: true,
    default: function () {
      return moment().tz("Asia/Ulaanbaatar").format("YYYY-MM-DD HH:mm:ss");
    },
  },
});

coachSchema.index({ phoneNo: 1 }, { unique: true });
coachSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hashSync(this.password, salt);
  }
});
coachSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
coachSchema.methods.getAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      club: this.club,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};
coachSchema.methods.getRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      club: this.club,
    },
    process.env.REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_EXPIRE,
    }
  );
};

module.exports = mongoose.model("coach", coachSchema);
