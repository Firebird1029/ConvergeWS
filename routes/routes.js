"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;

// Load Node Dependencies & Custom Modules
var express = require("express"),
	request = require("request"),
	_ = require("lodash"),
	router = express.Router(),
	utils = require("../utils.js"),
	models = require("./models.js");

module.exports = router;

// Render .pug view with data from the models to pass into functions inside the Pug views
function renderPage (req, res, baseName, tableNames, viewToRender, options = {}) {
	// Waterfall over the array of requested tables to collect all the records of all tables requested.
	var allRecords = [];
	utils.waterfallOverArray(tableNames, function (table, report) {
		// Retrieve data from the specified JSON file, using a models.js function.
		models.getFileData(baseName, table, function gotFileData (fileData) {
			allRecords.push(fileData);
			report();
		});
	}, function () {
		// Render the Pug view after all the data has been retrieved.
		res.render(viewToRender, {
			records: allRecords,
			options: options
		});
	});
}

// Send a POST request to Google to process reCAPTCHA
function processReCaptcha (req, callback) {
	request.post({
		// https://www.google.com/recaptcha/admin
		url: "https://www.google.com/recaptcha/api/siteverify",
		form: {secret: process.env.reCAPTCHA_SECRET, response: req.body["g-recaptcha-response"]}
	}, function (err, response, body) {
		if (debug && err) { throw new Error(err); }
		callback(JSON.parse(body).success);
	});
}

router.get("/", (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Converge"});
});

router.get("/index.html", (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Converge"});
});

// About
router.get("/history.html", (req, res) => {
	renderPage(req, res, "About Sections", ["History"], "aboutSections.pug", {pageTitle: "History"});
});

router.get("/staff.html", (req, res) => {
	renderPage(req, res, "About Staff", ["Staff"], "staff.pug", {pageTitle: "Our Staff"});
});

// Community
router.get("/youth.html", (req, res) => {
	renderPage(req, res, "Community", ["Youth"], "aboutSections.pug", {pageTitle: "Converge Youth"});
});

router.get("/coya.html", (req, res) => {
	renderPage(req, res, "Community", ["CoYA"], "aboutSections.pug", {pageTitle: "Converge Co.Y.A."});
});

router.get("/small-groups.html", (req, res) => {
	renderPage(req, res, "Community", ["Small Groups"], "tiles.pug", {pageTitle: "Small Groups"});
});

router.get("/ministries.html", (req, res) => {
	renderPage(req, res, "Community", ["Ministries", "Leaders"], "tiles.pug", {pageTitle: "Ministries"});
});

// Experience
router.get("/calendar.html", (req, res) => {
	renderPage(req, res, "Experience", ["Calendar"], "calendar.pug", {pageTitle: "Calendar"});
});

router.get("/classes.html", (req, res) => {
	renderPage(req, res, "Experience", ["Classes", "Leaders"], "tiles.pug", {pageTitle: "Classes"});
});

router.get("/photos.html", (req, res) => {
	renderPage(req, res, "Experience", ["Photos"], "photos.pug", {pageTitle: "Photos", collapsible: true});
});

// HE Brews
router.get("/hebrews.html", (req, res) => {
	renderPage(req, res, "HE Brews", ["HE Brews", "Menu"], "hebrews.pug", {pageTitle: "HE Brews"});
});

router.get("/he-brews.html", (req, res) => {
	renderPage(req, res, "HE Brews", ["HE Brews", "Menu"], "hebrews.pug", {pageTitle: "HE Brews"});
});

// Resources
router.get("/authentic-peace.html", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceRedirect.pug", {pageTitle: "Redirecting..."});
});
router.get("/authentic-peace/archive.html", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceArchive.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
});
router.get("/authentic-peace/:articleID", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeace.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
});

router.get("/articles-and-blogs.html", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Posts", "Authors"], "tiles.pug", {pageTitle: "Articles & Blogs", collapsible: true});
});

router.get("/tv.html", (req, res) => {
	renderPage(req, res, "Converge TV", ["Converge TV", "Topics", "Speakers"], "tv.pug", {pageTitle: "Converge TV"});
});

router.get("/sermons.html", (req, res) => {
	renderPage(req, res, "Past Sermons", ["Sermons", "Speakers", "Series"], "tiles.pug", {pageTitle: "Past Sermons", collapsible: true});
});

// Contact
router.get("/more-info.html", (req, res) => {
	renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(models.defaultFormRender, {pageTitle: "More Info", csrfToken: req.csrfToken()}));
});

router.post("/more-info.html", (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "More Info", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "email", "phone", "message"]});
		renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(processedFormData, {pageTitle: "More Info", csrfToken: req.csrfToken()}));
	});
});

router.get("/serve.html", (req, res) => {
	renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(models.defaultFormRender, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
});

router.post("/serve.html", (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "To Serve", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "email", "phone"]});
		renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(processedFormData, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
	});
});

router.get("/prayer.html", (req, res) => {
	renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(models.defaultFormRender, {pageTitle: "Prayer Requests", csrfToken: req.csrfToken()}));
});

router.post("/prayer.html", (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "For Prayer", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "message"]});
		renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(processedFormData, {pageTitle: "Prayer Requests", csrfToken: req.csrfToken()}));
	});
});
