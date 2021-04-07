"use strict" /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */;
var debug = !process.env.NODE_ENV;
console.log("Environment: ", process.env.NODE_ENV || "dev");
console.log("Debugging: ", debug);

// Load Node Dependencies & Custom Modules
var express = require("express"),
	app = express(),
	server = app.listen(process.env.PORT || process.argv[2] || 8000, function expressServerListening() {
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
	// Utilities & Custom Modules
	_ = require("lodash"),
	utils = require("./utils.js"),
	router = require("./routes/routes.js"),
	models = require("./routes/models.js");

// Setup Express Middleware
app.set("view engine", "pug");
app.use(helmet());

app.use(
	cookieSession({
		name: "session",
		keys: [process.env.COOKIE_SESSION_KEY_1, process.env.COOKIE_SESSION_KEY_2, process.env.COOKIE_SESSION_KEY_3],
		secure: true,
		sameSite: "lax",
	})
);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false })); // Used for sending HTML form data within POST requests
app.use(csrf({ cookies: true })); // HTML form security

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));

// Redirect converge.clch.org --> convergehawaii.org
// https://davidwalsh.name/express-redirect-301
// https://superuser.com/questions/304589/how-can-i-make-chrome-stop-caching-redirects
app.use((req, res, next) => {
	let host = req.get("Host");
	if (host === "converge.clch.org") {
		return res.redirect(301, "https://convergehawaii.org" + req.originalUrl);
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
var job = new CronJob(
	"*/12 * * * * *",
	function () {
		// Actual scanning happens in routes/models.js. This function simply transfers the pulled data into JSON files.
		models.scanEveryTable(models.bases, function scanEveryTableCallback(data) {
			Object.keys(data).forEach(function processFullDataCallback(key) {
				jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback(err) {
					if (debug && err) {
						throw new Error(err);
					}
				});
			});
			// debug && console.log(`Cron job successful! Files ${__dirname}/models/*.json updated.`);
		});
	},
	function () {
		debug && console.log("Cron job stopped.");
	},
	true,
	"Pacific/Honolulu"
);
