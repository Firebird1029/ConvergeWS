"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var express = require("express"),
	path = require("path"),
	router = express.Router(),
	utils = require("../utils.js"),
	models = require("./models.js");

module.exports = router;

function renderPage (req, res, baseName, tableName, viewToRender, pageTitle) {
	// If multiple tables are requested, then waterfall over the array to collect all the records of all tables requested.
	if (tableName.constructor === Array) {
		var allRecords = [];
		utils.waterfallOverArray(tableName, function (table, report) {
			// Retrieve data from the specified JSON file.
			models.getFileData(baseName, table, function gotFileData (fileData) {
				allRecords.push(Object.values(fileData));
				report();
			});
		}, function () {
			// Render the page with all the data retrieved.
			res.render(viewToRender, {
				records: allRecords,
				pageTitle: pageTitle
			});
		});
		
	} else {
		// Retrieve data from the specified JSON file, then render the page with the data retrieved.
		models.getFileData(baseName, tableName, function gotFileData (fileData) {
			res.render(viewToRender, {
				records: Object.values(fileData),
				pageTitle: pageTitle
			});
		});
	}
}

router.get("/", (req, res) => {
	renderPage(req, res, "About Sections", "Front Page", "index.pug", "Converge");
});

router.get("/index.html", (req, res) => {
	renderPage(req, res, "About Sections", "Front Page", "index.pug", "Converge");
});

// About
router.get("/about-clch.html", (req, res) => {
	renderPage(req, res, "About Sections", "About CLCH", "aboutSections.pug", "About CLCH");
});

router.get("/about-converge.html", (req, res) => {
	renderPage(req, res, "About Sections", "About Converge", "aboutSections.pug", "About Converge");
});

router.get("/about-coya.html", (req, res) => {
	renderPage(req, res, "About Sections", "CoYA", "aboutSections.pug", "About CoYA");
});

router.get("/about-staff.html", (req, res) => {
	renderPage(req, res, "About Staff", "Leads", "aboutStaff.pug", "Our Staff");
});

// Experience
router.get("/calendar.html", (req, res) => {
	renderPage(req, res, "Experience and Community", "Calendar", "calendar.pug", "Calendar");
});

router.get("/classes.html", (req, res) => {
	renderPage(req, res, "Experience and Community", "Classes", "tiles.pug", "Classes");
});

// Community
router.get("/ministries.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Ministries", "Leaders"], "tiles.pug", "Ministries");
});

// Resources
router.get("/authentic-peace/:article", (req, res) => {
	renderPage(req, res, "Resources", "Authentic Peace", "authenticPeace.pug", req.params.article);
});

router.get("/articles-and-blogs.html", (req, res) => {
	renderPage(req, res, "Articles and Blogs", "Posts", "aboutSections.pug", "Articles & Blogs");
});

// HE brews
router.get("/hebrews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", "HE brews");
});

router.get("/he-brews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", "HE brews");
});