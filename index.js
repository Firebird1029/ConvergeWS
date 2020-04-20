"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;
console.log("Environment: ", process.env.NODE_ENV || "dev");
console.log("Debugging: ", debug);

/*
 * TODO
 *
 * Playground:
 * https://developers.google.com/speed/pagespeed/insights/
 * Calendar -- modal for Bible Ministry, https://postare.github.io/bulma-modal-fx/ (?)
 * Fuzzy string matching + TextRazor NLP API (?)
 * https://www.cloudflare.com/plans/
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
	cookieSession = require("cookie-session"),
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
app.use(cookieSession({
	name: "session",
	keys: ["key1", "key2"]
}));

// For some reason, using session without using database has memory leak, so CSRF does not work in production (and SSL?) cookie-session less safe, but works without database
// app.use(session({
// 	secret: "jdfgyt3478h3n4v74y3vb3487yvb3487fvn3f",
// 	resave: false,
// 	saveUninitialized: false,
// 	cookie: { maxAge: 60000 },
// 	secure: true
// }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false})); // Used for sending HTML form data within POST requests
app.use(csrf({cookies: true})); // HTML form security

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));

// https://davidwalsh.name/express-redirect-301
app.use((req, res, next) => {
	let host = req.get("Host");
	if (host === "converge.clch.org") {
		let newPath = "https://convergehawaii.org" + req.originalUrl
		return res.redirect(301, newPath);
	}
	return next();
});

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
