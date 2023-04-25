var express = require("express");
var authRouter = require("./auth");

var experienceRouter = require("./experience");

var app = express();

app.use("/auth/", authRouter);

app.use("/experience/", experienceRouter);

module.exports = app;