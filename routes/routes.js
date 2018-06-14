"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var express = require("express"),
	path = require("path"),
	router = express.Router(),
	models = require("./models.js");

module.exports = router;

// router.get("/", function (req, res) {
// 	res.sendFile(path.join(__dirname, "../public/index.html"));
// });

router.get("/", (req, res) => {
	models.getFileData("About Sections", "Front Page", function gotFileData (fileData) {
		res.render("index.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/index.html", (req, res) => {
	models.getFileData("About Sections", "Front Page", function gotFileData (fileData) {
		res.render("index.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/about-converge.html", (req, res) => {
	models.getFileData("About Sections", "About Converge", function gotFileData (fileData) {
		res.render("aboutSections.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/about-clch.html", (req, res) => {
	models.getFileData("About Sections", "About CLCH", function gotFileData (fileData) {
		res.render("aboutSections.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/about-coya.html", (req, res) => {
	models.getFileData("About Sections", "CoYA", function gotFileData (fileData) {
		res.render("aboutSections.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/about-staff.html", (req, res) => {
	models.getFileData("About Staff", "Leads", function gotFileData (fileData) {
		res.render("aboutStaff.pug", {
			records: Object.values(fileData)
		});
	});
});

router.get("/calendar.html", (req, res) => {
	models.getFileData("Experience and Community", "Calendar", function gotFileData (fileData) {
		res.render("calendar.pug", {
			records: Object.values(fileData)
		});
	});
});