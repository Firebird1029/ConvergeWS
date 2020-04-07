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
			records: allRecords, // array
			options: options // object
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

router.get(["/", "/index.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Converge"});
});

// About
router.get(["/values", "/values.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["Values"], "aboutSections.pug", {pageTitle: "Values"});
});
router.get(["/history", "/history.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["History"], "aboutSections.pug", {pageTitle: "History"});
});

router.get(["/staff", "/staff.html"], (req, res) => {
	renderPage(req, res, "About Staff", ["Staff"], "staff.pug", {pageTitle: "Our Staff"});
});

// Experience
router.get(["/calendar", "/calendar.html"], (req, res) => {
	renderPage(req, res, "Experience", ["Calendar"], "calendar.pug", {pageTitle: "Calendar"});
});

router.get(["/classes", "/classes.html"], (req, res) => {
	renderPage(req, res, "Experience", ["Classes", "Leaders"], "tiles.pug", {pageTitle: "Classes"});
});

router.get(["/photos", "/photos.html"], (req, res) => {
	renderPage(req, res, "Experience", ["Photos"], "photos.pug", {pageTitle: "Photos", collapsible: true});
});

// Community
router.get(["/announcements", "/announcements.html"], (req, res) => {
	renderPage(req, res, "Community", ["Announcements"], "tiles.pug", {pageTitle: "Announcements"});
});

router.get(["/youth", "/youth.html"], (req, res) => {
	renderPage(req, res, "Community", ["Youth"], "aboutSections.pug", {pageTitle: "Converge Youth"});
});

router.get(["/coya", "/coya.html"], (req, res) => {
	renderPage(req, res, "Community", ["CoYA"], "aboutSections.pug", {pageTitle: "Converge CoYA"});
});

router.get(["/ministries", "/ministries.html"], (req, res) => {
	renderPage(req, res, "Community", ["Ministries", "Leaders"], "tiles.pug", {pageTitle: "Ministries"});
});

router.get(["/forms", "/forms.html"], (req, res) => {
	renderPage(req, res, "Community", ["Forms"], "tiles.pug", {pageTitle: "Forms and Reg"});
});

// Video
router.get(["/jitsi", "/jitsi.html"], (req, res) => {
	renderPage(req, res, "Community", ["Jitsi"], "jitsi.pug", {pageTitle: "Jitsi"});
});

router.get(["/palehua-room", "/palehua-room.html"], (req, res) => {
	renderPage(req, res, "Community", ["Room 1"], "jitsi.pug", {pageTitle: "Palehua Room"});
});

router.get(["/mokuleia-room", "/mokuleia-room.html"], (req, res) => {
	renderPage(req, res, "Community", ["Room 2"], "jitsi.pug", {pageTitle: "Mokuleia Room"});
});

router.get(["/kauai-room", "/kauai-room.html"], (req, res) => {
	renderPage(req, res, "Community", ["Room 3"], "jitsi.pug", {pageTitle: "Kauai Room"});
});

// Be Blessed
router.get(["/beblessed", "/be-blessed", "/beblessed.html", "/be-blessed.html"], (req, res) => {
	renderPage(req, res, "Storefront", ["Storefront", "Contact"], "tiles.pug", {pageTitle: "Be Blessed"});
});

// HE Brews
router.get(["/hebrews", "/he-brews", "/hebrews.html", "/he-brews.html"], (req, res) => {
	renderPage(req, res, "HE Brews", ["HE Brews", "Menu"], "hebrews.pug", {pageTitle: "He Brews"});
});


// Resources
router.get(["/live", "/live.html"], (req, res) => {
	res.render("livestream.pug", {
		// records: allRecords, // array
		options: {pageTitle: "Live Stream"} // object
	});
});

router.get(["/tv", "/tv.html"], (req, res) => {
	renderPage(req, res, "Converge TV", ["Converge TV", "Topics", "Speakers"], "tv.pug", {pageTitle: "Converge TV"});
});

router.get(["/sermons", "/sermons.html"], (req, res) => {
	renderPage(req, res, "Past Sermons", ["Sermons", "Speakers", "Series"], "sermons.pug", {pageTitle: "Past Sermons", collapsible: true});
});
router.get(["/sermons/archive", "/sermons/archive.html"], (req, res) => {
	renderPage(req, res, "Past Sermons", ["Sermons", "Speakers", "Series"], "sermonArchive.pug", {pageTitle: "Past Sermons", id: req.params.articleID});
});

router.get(["/authentic-peace", "/authentic-peace.html"], (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceRedirect.pug", {pageTitle: "Redirecting..."});
});
router.get(["/authentic-peace/archive", "/authentic-peace/archive.html"], (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceArchive.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
});
router.get("/authentic-peace/:articleID", (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeace.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
});

router.get(["/articles-and-blogs", "/articles-and-blogs.html"], (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Posts", "Authors"], "tiles.pug", {pageTitle: "Articles and Blogs", collapsible: true});
});

// Contact
router.get(["/more-info", "/more-info.html"], (req, res) => {
	renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(models.defaultFormRender, {pageTitle: "More_Info", csrfToken: req.csrfToken()}));
});

router.post(["/more-info", "/more-info.html"], (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "More Info", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "email", "phone", "message"]});
		renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(processedFormData, {pageTitle: "More_Info", csrfToken: req.csrfToken()}));
	});
});

router.get(["/serve", "/serve.html"], (req, res) => {
	renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(models.defaultFormRender, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
});

router.post(["/serve", "/serve.html"], (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "To Serve", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "email", "phone"]});
		renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(processedFormData, {pageTitle: "Serve", csrfToken: req.csrfToken()}));
	});
});

router.get(["/prayer", "/prayer.html"], (req, res) => {
	renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(models.defaultFormRender, {pageTitle: "Prayer_Requests", csrfToken: req.csrfToken()}));
});

router.post(["/prayer", "/prayer.html"], (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "For Prayer", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "message"]});
		renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(processedFormData, {pageTitle: "Prayer_Requests", csrfToken: req.csrfToken()}));
	});
});

router.get(["/baptism-and-confirmation", "/baptism-and-confirmation.html"], (req, res) => {
	renderPage(req, res, "Contact Responses", ["Baptism and Confirmation"], "baptism-and-confirmation.pug", _.merge(models.defaultFormRender, {pageTitle: "Baptism_Confirmation", csrfToken: req.csrfToken()}));
});

router.post(["/baptism-and-confirmation", "/baptism-and-confirmation.html"], (req, res) => {
	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
		// Sending to models.js for validation and sanitization.
		var processedFormData = models.processForm("Contact Responses", "Baptism and Confirmation", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "message"]});
		renderPage(req, res, "Contact Responses", ["Baptism and Confirmation"], "baptism-and-confirmation.pug", _.merge(processedFormData, {pageTitle: "Baptism_Confirmation", csrfToken: req.csrfToken()}));
	});
});
