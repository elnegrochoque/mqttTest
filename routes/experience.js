var express = require("express");
const ExperienceController = require("../../ejemplo-mqtt/controllers/ExperienceController");

var router = express.Router();

router.post("/add", ExperienceController.createExperience);
router.post("/log", ExperienceController.log);

module.exports = router;