const express = require("express");
const router = express.Router();
const {
  getPersonalInfo,
  setPersonalInfo,
  getClubInfo,
  deleteAccount,
} = require("../../controller/personal");
const { body, query } = require("express-validator");
const requestDataValidation = require("../../middleware/requestDataValidation");

router.route("/get").get(getPersonalInfo);
router
  .route("/set")
  .put(
    body("phoneNo")
      .isString()
      .isLength({ min: 8, max: 8 })
      .withMessage("Утасны дугаар буруу байна")
      .notEmpty(),
    body("firstName").isString().withMessage("Нэр буруу байна").optional(),
    body("lastName").isString().withMessage("Овог буруу байна").optional(),
    body("birthDate")
      .isString()
      .withMessage("Он сар өдөр буруу байна")
      .optional(),
    body("height").isNumeric().withMessage("Өндөр буруу байна").optional(),
    body("weight").isNumeric().withMessage("Жин буруу байна").optional(),
    body("imageUrl")
      .isString()
      .withMessage("Зурагны холбоос буруу байна")
      .optional(),
    requestDataValidation,
    setPersonalInfo
  );
router.route("/club").get(getClubInfo);
router.route("/delete").delete(deleteAccount);

module.exports = router;
