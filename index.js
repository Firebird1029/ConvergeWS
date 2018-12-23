"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;
console.log("Environment: ", process.env.NODE_ENV || "dev");
console.log("Debugging: ", debug);

/*
 * TODO
 * When viewed on responsive laptop, switches to mobile view
 * Fix mobile formatting: mobile navbar does not scroll
 * Fix NEW dependencies via template, Browsersync, then update dependencies, audit fix
 * 			Update template, comment code
 *
 * Once domain is set: add domain to FA CDN account, add domain to Google reCAPTCHA, add Google Analytics
 * Calendar: make arrows far instead of fas
 * https://developers.google.com/speed/pagespeed/insights/
 * Add logo to navbar (Sandy)
 * Fuzzy string matching + TextRazor NLP API (nope)
 */

// Load Node Dependencies & Custom Modules
var express = require("express"),
	app = express(),
	server = app.listen(process.env.PORT || (process.argv[2] || 8000), function expressServerListening () {
		debug && console.log(server.address());
	}),

	// Express Middleware
	helmet = require("helmet"),
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	bodyParser = require("body-parser"),
	csrf = require("csurf"),

	// Project-Specific Dependencies
	CronJob = require("cron").CronJob,
	jsonfile = require("jsonfile"),
	io = require("socket.io"),
	listener = io.listen(server),

	// Utilities & Custom Modules
	_ = require("lodash"),
	utils = require("./utils.js"),
	router = require("./routes/routes.js"),
	models = require("./routes/models.js");

// Setup Express Middleware
app.set("view engine", "pug");
app.use(helmet());
app.use(session({
	secret: "jdfgyt3478h3n4v74y3vb3487yvb3487fvn3f",
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 60000 },
	secure: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false})); // Used for sending HTML form data within POST requests
app.use(csrf({cookies: true})); // HTML form security

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));
app.use("/", router);
app.use((req, res, next) => {
	res.status(404).render("404.pug");
});

// Scheduling By Cron Job
// 00 */2 * * * * -- every 2 hours
// */6 * * * * * -- every 10 seconds
// */12 * * * * * -- every 5 seconds
var job = new CronJob("*/12 * * * * *", function () {
	// Actual scanning happens in routes/models.js. This function simply transfers the pulled data into JSON files.
	models.scanEveryTable(models.bases, function scanEveryTableCallback (data) {			
		Object.keys(data).forEach(function processFullDataCallback (key) {
			jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback (err) {
				if (debug && err) { throw new Error(err); }
			});
		});
		// debug && console.log(`Cron job successful! Files ${__dirname}/models/*.json updated.`);
	});
}, function () {
	debug && console.log("Cron job stopped.");
}, true, "Pacific/Honolulu");
