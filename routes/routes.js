"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;

// Load Node Modules & Custom Modules
var express = require("express"),
	request = require("request"),
	_ = require("lodash"),
	router = express.Router(),
	utils = require("../utils.js"),
	models = require("./models.js");

module.exports = router;

// Render .pug with data from the models to pass into Pug functions
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

// Send a POST request to Google to process reCAPTCHA
function processReCaptcha (req, callback) {
	request.post({
		url: "https://www.google.com/recaptcha/api/siteverify",
		form: {secret: "6LcQoGEUAAAAAD4O3uh6Nw4THDYnB-YgJdL8pZ4w", response: req.body["g-recaptcha-response"]}
	}, function (err, response, body) {
		if (debug && err) { throw new Error(err); }
		callback(JSON.parse(body).success);
	});
}

router.get("/test.html", (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "TEST.pug", {pageTitle: "Converge"});
});

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

router.get("/photos.html", (req, res) => {
	renderPage(req, res, "Experience and Community", ["Photos", "Ministries"], "photos.pug", {pageTitle: "Photos"});
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

router.get("/sermons.html", (req, res) => {
	renderPage(req, res, "Sermons", ["Sermons", "Speakers", "Series"], "tiles.pug", {pageTitle: "Sermons", collapsible: true});
});

// HE brews
router.get("/hebrews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", {pageTitle: "HE brews"});
});

router.get("/he-brews.html", (req, res) => {
	renderPage(req, res, "HE brews", ["HE brews", "Menu"], "hebrews.pug", {pageTitle: "HE brews"});
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
	renderPage(req, res, "Contact Responses", ["Serve"], "serve.pug", _.merge(models.defaultFormRender, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
});

router.post("/serve.html", (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "Serve", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "email", "phone"]});
		renderPage(req, res, "Contact Responses", ["Serve"], "serve.pug", _.merge(processedFormData, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
	});
});

router.get("/prayer.html", (req, res) => {
	renderPage(req, res, "Contact Responses", ["Prayer"], "prayer.pug", _.merge(models.defaultFormRender, {pageTitle: "Prayer Requests", csrfToken: req.csrfToken()}));
});

router.post("/prayer.html", (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "Prayer", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "message"]});
		renderPage(req, res, "Contact Responses", ["Prayer"], "prayer.pug", _.merge(processedFormData, {pageTitle: "Prayer Requests", csrfToken: req.csrfToken()}));
	});
});