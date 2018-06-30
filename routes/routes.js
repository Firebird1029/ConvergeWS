"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var express = require("express"),
	path = require("path"),
	router = express.Router(),
	utils = require("../utils.js"),
	models = require("./models.js");

module.exports = router;

function renderPage (req, res, baseName, tableName, viewToRender, options = {}) {
	// Waterfall over the array of requested tables to collect all the records of all tables requested.
	var allRecords = [];
	utils.waterfallOverArray(tableName, function (table, report) {
		// Retrieve data from the specified JSON file, using models.js.
		models.getFileData(baseName, table, function gotFileData (fileData) {
			allRecords.push(fileData);
			report();
		});
	}, function () {
		// Render the page with all the data retrieved.
		res.render(viewToRender, {
			records: allRecords,
			options: options
		});
	});
}

router.get("/", (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Converge"});
});

router.get("/index.html", (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Converge"});
});

// About
router.get("/about-clch.html", (req, res) => {
	renderPage(req, res, "About Sections", ["About CLCH"], "aboutSections.pug", {pageTitle: "About CLCH"});
});

router.get("/about-converge.html", (req, res) => {
	renderPage(req, res, "About Sections", ["About Converge"], "aboutSections.pug", {pageTitle: "About Converge"});
});

router.get("/about-coya.html", (req, res) => {
	renderPage(req, res, "About Sections", ["CoYA"], "aboutSections.pug", {pageTitle: "About CoYA"});
});

router.get("/about-staff.html", (req, res) => {
	renderPage(req, res, "About Staff", ["Leads"], "aboutStaff.pug", {pageTitle: "Our Staff"});
});

// Experience
router.get("/calendar.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Calendar"], "calendar.pug", {pageTitle: "Calendar"});
});

router.get("/classes.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Classes", "Leaders"], "tiles.pug", {pageTitle: "Classes"});
});

// Community
router.get("/ministries.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Ministries", "Leaders"], "tiles.pug", {pageTitle: "Ministries"});
});

router.get("/activities.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Activities"], "tiles.pug", {pageTitle: "Activities"});
});

// Resources
router.get("/authentic-peace/:article", (req, res) => {
	renderPage(req, res, "Resources", ["Authentic Peace"], "authenticPeace.pug", req.params.article);
});

router.get("/articles-and-blogs.html", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Posts"], "aboutSections.pug", {pageTitle: "Articles & Blogs"});
});

router.get("/sermons.html", (req, res) => {
	renderPage(req, res, "Sermons", ["Sermons", "Speakers", "Series"], "tiles.pug", {pageTitle: "Sermons"});
});

// HE brews
router.get("/hebrews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", {pageTitle: "HE brews"});
});

router.get("/he-brews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", {pageTitle: "HE brews"});
});