const SocketClient = require("../models/SocketClientModel");
const { body, check, validationResult } = require("express-validator");
const net = require("net");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

/**
 * Send message.
 * 
 * @param {string}      host 
 * @param {string}      port
 * @param {string}      message
 * 
 * @returns {Object}
 */
exports.sendMessage = [
	body("host", "Host must not be empty.").isLength({ min: 1 }).trim(),
	body("port", "Port must not be empty.").isLength({ min: 1 }).trim(),
	body("message", "Message must not be empty").isLength({ min: 1 }).trim(),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				const { host, port, message } = req.body;
				let ret = await callServer(host, port, message);
				var socketClient = new SocketClient(
					{ host: host,
						port: port,
						message: message,
						detailConnection: ret
					});
				socketClient.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
					return apiResponse.successResponseWithData(res, ret);
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Logs socket.
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

				SocketClient.find(query, function (err, data) {
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

async function callServer(host, port, formattedJson) {

	var timeout = 500;
  
	return new Promise((resolve) => {
		let client = new net.Socket();
  
		client.connect(port, host, () => {
			client.write(formattedJson);
		});
  
		client.on("data", () => {
			resolve("Socket connection successful");
			client.destroy();
		});
  
		client.on("close", function() {
			resolve("Socket connection closed");
		});
  
		client.on("error", function() {
			resolve("Socket connection error");
		});
  
		setTimeout(function() {
			client.destroy();
		}, timeout);
  
	});
}