const express = require("express");
const router = express.Router();
const {
  signUp,
  login,
  refreshToken,
  authenticate,
  resetPassword,
} = require("../../controller/auth");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router
  .route("/signup")
  .post(
    body("phoneNo")
      .isString()
      .isLength({ min: 8, max: 8 })
      .withMessage("Утасны дугаар буруу байна")
      .notEmpty(),
    body("registrationNumber").isString().notEmpty(),
    body("firstName").isString().notEmpty(),
    body("lastName").isString().notEmpty(),
    body("password").isString().notEmpty(),
    requestDataValidation,
    signUp
  );
router
  .route("/login")
  .post(
    body("phoneNo")
      .isString()
      .isLength({ min: 8, max: 8 })
      .withMessage("Утасны дугаар буруу байна")
      .notEmpty(),
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
    body("phoneNo")
      .isString()
      .isLength({ min: 8, max: 8 })
      .withMessage("Утасны дугаар буруу байна")
      .notEmpty(),
    body("password").isString().notEmpty(),
    requestDataValidation,
    resetPassword
  );

module.exports = router;
