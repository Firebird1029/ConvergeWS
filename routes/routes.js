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
	renderPage(req, res, "About Sections", ["Front Page"], "index.pug", {pageTitle: "Home"});
});

// About
router.get(["/staff", "/staff.html", "/teamleaders", "/team-leaders", "/teamleaders.html", "/team-leaders.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["Team Leaders"], "staff.pug", {pageTitle: "Our Team Leaders"});
});
router.get(["/history", "/history.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["History"], "aboutSections.pug", {pageTitle: "History"});
});
router.get(["/values", "/values.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["Values"], "aboutSections.pug", {pageTitle: "Values"});
});

// Look Up
router.get(["/announcements", "/announcements.html"], (req, res) => {
	renderPage(req, res, "Community", ["Announcements"], "tiles.pug", {pageTitle: "Announcements"});
});
router.get(["/calendar", "/calendar.html"], (req, res) => {
	renderPage(req, res, "Experience", ["Calendar"], "calendar.pug", {pageTitle: "Calendar"});
});
router.get(["/forms", "/forms.html"], (req, res) => {
	renderPage(req, res, "Community", ["Forms"], "tiles.pug", {pageTitle: "Forms and Reg"});
});
router.get(["/sermons", "/sermons.html"], (req, res) => {
	renderPage(req, res, "Past Sermons", ["Sermons", "Speakers", "Series"], "tiles.pug", {pageTitle: "Past Sermons", collapsible: false, hasArchive: true, archiveParentPath: "sermons", archiveTime: "a month"});
});
router.get(["/sermons/archive", "/sermons/archive.html"], (req, res) => {
	renderPage(req, res, "Past Sermons", ["Sermons", "Speakers", "Series"], "sermonArchive.pug", {pageTitle: "Past Sermons"});
});
// router.get(["/authentic-peace", "/authentic-peace.html"], (req, res) => {
// 	renderPage(req, res, "Articles and Blogs", ["Yumpu", "Authentic Peace"], "authenticPeace.pug", {pageTitle: "Authentic Peace"});
// });
// router.get(["/authentic-peace/archive", "/authentic-peace/archive.html"], (req, res) => {
// 	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceArchive.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
// });
// router.get(["/authentic-peace", "/authentic-peace.html"], (req, res) => {
// 	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeaceRedirect.pug", {pageTitle: "Redirecting..."});
// });
// router.get("/authentic-peace/:articleID", (req, res) => {
// 	renderPage(req, res, "Articles and Blogs", ["Authentic Peace"], "authenticPeace.pug", {pageTitle: "Authentic Peace", id: req.params.articleID});
// });
router.get(["/articles-and-blogs", "/articles-and-blogs.html"], (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Posts", "Authors"], "tiles.pug", {pageTitle: "Articles and Blogs", collapsible: true, noIndex: true, hasArchive: true, archiveParentPath: "articles-and-blogs", archiveTime: "a week"});
});
router.get(["/articles-and-blogs/archive", "/articles-and-blogs/archive.html"], (req, res) => {
	renderPage(req, res, "Articles and Blogs", ["Posts", "Authors"], "articleArchive.pug", {pageTitle: "Articles and Blogs"});
});
// router.get(["/beblessed", "/be-blessed", "/beblessed.html", "/be-blessed.html"], (req, res) => {
// 	renderPage(req, res, "Storefront", ["Storefront", "Contact"], "tiles.pug", {pageTitle: "Be Blessed"});
// });
router.get(["/photos", "/photos.html"], (req, res) => {
	renderPage(req, res, "Experience", ["Photos"], "photos.pug", {pageTitle: "Photos", collapsible: true});
});

// Community
// router.get(["/youth", "/youth.html"], (req, res) => {
// 	renderPage(req, res, "Community", ["Youth"], "aboutSections.pug", {pageTitle: "Converge Youth"});
// });
// router.get(["/coya", "/coya.html"], (req, res) => {
// 	renderPage(req, res, "Community", ["CoYA"], "aboutSections.pug", {pageTitle: "Converge CoYA"});
// });
// router.get(["/ministries", "/ministries.html"], (req, res) => {
// 	renderPage(req, res, "Community", ["Ministries", "Leaders"], "tiles.pug", {pageTitle: "Ministries"});
// });
// router.get(["/classes", "/classes.html"], (req, res) => {
// 	renderPage(req, res, "Experience", ["Classes", "Leaders"], "tiles.pug", {pageTitle: "Classes"});
// });

// Hangout
router.get(["/live", "/live.html"], (req, res) => {
	// https://support.glitch.com/t/resolved-access-control-allow-origin-header-is-present-on-the-requested-resource/5894/5
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	renderPage(req, res, "Converge TV", ["Youtube Live"], "livestream.pug", {pageTitle: "Live Stream"});
});
router.get(["/listen", "/listen.html"], (req, res) => {
	renderPage(req, res, "Converge Listen", ["Listen"], "tiles.pug", {pageTitle: "Converge Listen", tvPage: false});
});
router.get(["/tv", "/tv.html"], (req, res) => {
	renderPage(req, res, "Converge TV", ["Converge TV", "Speakers", "Topics"], "tiles.pug", {pageTitle: "Converge TV", tvPage: true});
});
// router.get(["/jitsi", "/jitsi.html"], (req, res) => {
// 	renderPage(req, res, "Meeting Rooms", ["Jitsi"], "jitsi.pug", {pageTitle: "Jitsi"});
// });
// router.get(["/palehua-room", "/palehua-room.html"], (req, res) => {
// 	renderPage(req, res, "Meeting Rooms", ["Palehua"], "jitsi.pug", {pageTitle: "Palehua Room"});
// });
// router.get(["/mokuleia-room", "/mokuleia-room.html"], (req, res) => {
// 	renderPage(req, res, "Meeting Rooms", ["Mokuleia"], "jitsi.pug", {pageTitle: "Mokuleia Room"});
// });
// router.get(["/kauai-room", "/kauai-room.html"], (req, res) => {
// 	renderPage(req, res, "Meeting Rooms", ["Kauai"], "jitsi.pug", {pageTitle: "Kauai Room"});
// });

// HE Brews
router.get(["/hebrews", "/he-brews", "/hebrews.html", "/he-brews.html"], (req, res) => {
	renderPage(req, res, "HE Brews", ["HE Brews", "Menu"], "hebrews.pug", {pageTitle: "He Brews"});
});

// Give
router.get(["/give", "/give.html"], (req, res) => {
	renderPage(req, res, "About Sections", ["Front Page"], "give.pug", {pageTitle: "Give"});
});

// Contact - COMMENTED OUT
// router.get(["/prayer", "/prayer.html"], (req, res) => {
// 	renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(models.defaultFormRender, {pageTitle: "Prayer Requests", headerImage: "Prayer_Requests", csrfToken: req.csrfToken()}));
// });

// router.post(["/prayer", "/prayer.html"], (req, res) => {
// 	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
// 		// Sending to models.js for validation and sanitization.
// 		var processedFormData = models.processForm("Contact Responses", "For Prayer", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "message"]});
// 		renderPage(req, res, "Contact Responses", ["For Prayer"], "prayer.pug", _.merge(processedFormData, {pageTitle: "Prayer Requests", headerImage: "Prayer_Requests", csrfToken: req.csrfToken()}));
// 	});
// });

// router.get(["/serve", "/serve.html"], (req, res) => {
// 	renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(models.defaultFormRender, {pageTitle: "Serve", headerImage: "Serve", csrfToken: req.csrfToken()}));
// });

// router.post(["/serve", "/serve.html"], (req, res) => {
// 	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
// 		// Sending to models.js for validation and sanitization.
// 		var processedFormData = models.processForm("Contact Responses", "To Serve", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "email", "phone"]});
// 		renderPage(req, res, "Contact Responses", ["To Serve"], "serve.pug", _.merge(processedFormData, {pageTitle: "Serve", headerImage: "Serve", csrfToken: req.csrfToken()}));
// 	});
// });

// router.get(["/devos", "/devos.html"], (req, res) => {
// 	renderPage(req, res, "Devotions", ["Entries"], "devos.pug", _.merge(models.defaultFormRender, {pageTitle: "Submit Devotions", headerImage: "Devos", csrfToken: req.csrfToken()}));
// });

// router.post(["/devos", "/devos.html"], (req, res) => {
// 	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
// 		// Sending to models.js for validation and sanitization.
// 		var processedFormData = models.processForm("Devotions", "Entries", req.body, {reCaptcha: reCaptcha, expectedFields: ["fname", "lname", "title", "entry", "selection", "selection2"]});
// 		renderPage(req, res, "Devotions", ["Entries"], "devos.pug", _.merge(processedFormData, {pageTitle: "Submit Devotions", headerImage: "Devos", csrfToken: req.csrfToken()}));
// 	});
// });

// router.get(["/booking-time", "/booking-time.html"], (req, res) => {
// 	renderPage(req, res, "Contact Responses", ["Booking Time"], "bookingTime.pug", _.merge(models.defaultFormRender, {pageTitle: "Booking Time", csrfToken: req.csrfToken()}));
// });

// router.get(["/baptism-and-confirmation", "/baptism-and-confirmation.html"], (req, res) => {
// 	renderPage(req, res, "Contact Responses", ["Baptism and Confirmation"], "baptismConfirmation.pug", _.merge(models.defaultFormRender, {pageTitle: "Baptism & Confirmation", headerImage: "Baptism Confirmation", csrfToken: req.csrfToken()}));
// });

// router.post(["/baptism-and-confirmation", "/baptism-and-confirmation.html"], (req, res) => {
// 	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
// 		// Sending to models.js for validation and sanitization.
// 		var processedFormData = models.processForm("Contact Responses", "Baptism and Confirmation", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "selection", "message"]});
// 		renderPage(req, res, "Contact Responses", ["Baptism and Confirmation"], "baptismConfirmation.pug", _.merge(processedFormData, {pageTitle: "Baptism & Confirmation", headerImage: "Baptism Confirmation", csrfToken: req.csrfToken()}));
// 	});
// });

// router.get(["/more-info", "/more-info.html"], (req, res) => {
// 	renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(models.defaultFormRender, {pageTitle: "More Info", csrfToken: req.csrfToken()}));
// });

// router.post(["/more-info", "/more-info.html"], (req, res) => {
// 	processReCaptcha(req, function finishedProcessingReCaptcha (reCaptcha) {
// 		// Sending to models.js for validation and sanitization.
// 		var processedFormData = models.processForm("Contact Responses", "More Info", req.body, {reCaptcha: reCaptcha, expectedFields: ["name", "email", "phone", "message"]});
// 		renderPage(req, res, "Contact Responses", ["More Info"], "moreInfo.pug", _.merge(processedFormData, {pageTitle: "More Info", csrfToken: req.csrfToken()}));
// 	});
// });
