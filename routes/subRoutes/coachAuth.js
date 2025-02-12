const express = require("express");
const router = express.Router();
const {
  authenticate,
  login,
  refreshToken,
  resetPassword,
  signUp,
} = require("../../couchController/auth");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/signup")
  .post(
    body("phoneNo").isString().notEmpty(),
    body("firstName").isString().withMessage("Нэр буруу байна"),
    body("lastName").isString().withMessage("Овог буруу байна"),
    body("password").isString().notEmpty(),
    requestDataValidation,
    signUp
  );
router
  .route("/login")
  .post(
    body("phoneNo").isString().notEmpty(),
    body("password").isString().notEmpty(),
    requestDataValidation,
    login
  );
router
  .route("/refresh_token")
  .get(query("refreshToken").isString(), requestDataValidation, refreshToken);
router.route("/authenticate").get(authenticate);
router
  .route("/reset_password")
  .post(
    body("phoneNo").isString().notEmpty(),
    body("password").isString().notEmpty(),
    requestDataValidation,
    resetPassword
  );

module.exports = router;
