const Experience = require("../models/ExperienceModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

/**
 * Create experience.
 * 
 * @param {timestamp}	startTime 
 * @param {timestamp}   endTime
 * @param {string}      showroomName
 * @param {string}      pc-name
 * @param {string}      location
 * @param [string]      clients
 * @param [string]      pakList
 * @param [string]      mapSecuence
 * @returns {Object}
 */
exports.createExperience = [
	check("startTime").trim().not().isEmpty().withMessage('Invalid date!')
	.isISO8601('yyyy-mm-dd hh:mm:ss').withMessage('Format date yyyy-mm-dd hh:mm:ss').bail(),
	check("endTime").trim().not().isEmpty().withMessage('Invalid date!')
	.isISO8601('yyyy-mm-dd hh:mm:ss').withMessage('Format date yyyy-mm-dd hh:mm:ss').bail(),
	body("showroomName", "showroomName must not be empty.").isLength({ min: 1 }).trim(),
	body("pcName", "pc-name must not be empty.").isLength({ min: 1 }).trim(),
	body("location", "location must not be empty.").isLength({ min: 1 }).trim(),
	//body("clients").not().isEmpty().withMessage('clients must not be empty!'),
	body("pakList").not().isEmpty().withMessage('pakList must not be empty!'),
	body("mapSecuence").not().isEmpty().withMessage('mapSecuence must not be empty!'),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				const { startTime, endTime, showroomName, pcName, location, clients, pakList, mapSecuence } = req.body;
				var experience = new Experience(
					{ startTime: startTime,
					  endTime: endTime,
					  showroomName: showroomName,
					  pcName: pcName,
					  location: location,
					  clients: clients,
					  pakList: pakList,
					  mapSecuence: mapSecuence
					});
				experience.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
					return apiResponse.successResponseWithData(res, experience);
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Logs experience.
 * 
 * @param {string}      from 
 * @param {string}      to
 * 
 * @returns {Object}
 */
 exports.log = [
	check("from").trim().not().isEmpty().withMessage('Invalid date!')
	.isISO8601('yyyy-mm-dd').withMessage('Format date yyyy-mm-dd').bail(),
	check("to").trim().not().isEmpty().withMessage('Invalid date!')
	.isISO8601('yyyy-mm-dd').withMessage('Format date yyyy-mm-dd').bail(),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				const { from, to } = req.body;
				var query = {
					createdAt: {
						$gte: new Date(req.body.from).toISOString(),
						$lte: new Date(req.body.to).toISOString()
					}
				}

				Experience.find(query, function (err, data) {
					if (err) { return res.status(300).json("Error") }
					else {
						return res.status(200).json({ data: data })
					}
				})
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];