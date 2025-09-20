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
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: _.assign(helmet.contentSecurityPolicy.getDefaultDirectives(), {
				"script-src": [
					"'self'",
					"cdn.jsdelivr.net",
					"cdnjs.cloudflare.com",
					"use.fontawesome.com",

					"maps.googleapis.com", // Google Maps
					"www.google.com", // ReCaptcha
					"www.gstatic.com", // ReCaptcha
					"players.yumpu.com", // Authentic Peace

					// Google Analytics
					"www.googletagmanager.com www.google-analytics.com ssl.google-analytics.com",
					"'sha256-BaMa7DEnqMbttTIFHxvpRSKIVRZeqVpRaA8EzEU8lw4='",
					"'sha256-oByu3isyoualNW0NX6KCfG52kLL6eFagsUSOlk5jiUM='",

					// Hubspot
					"js.hs-scripts.com js.hs-analytics.net js.hscollectedforms.net js.hs-banner.com js.usemessages.com *.hubspot.com *.hsforms.net *.hsforms.com",
				],
				"img-src": [
					"'self'",
					"data:",
					"www.googletagmanager.com www.google-analytics.com",
					// Strapi image sources:
					...(debug ? ["localhost:1337"] : []),
					"informed-power-b659f309b0.media.strapiapp.com",
					"maps.gstatic.com",
					"*.googleapis.com",
					"*.hubspot.com *.hsforms.com",
				],
				"connect-src": ["'self'", "www.google-analytics.com", "*.hubspot.com", "*.googleapis.com"],
				"frame-src": ["*"],
			}),
		},
	})
);

app.use(
	cookieSession({
		name: "session",
		keys: [process.env.COOKIE_SESSION_KEY_1, process.env.COOKIE_SESSION_KEY_2, process.env.COOKIE_SESSION_KEY_3],
		sameSite: "lax",
	})
);

// Webhook endpoint for Strapi content updates (before CSRF middleware)
if (!process.env.WEBHOOK_AUTH_TOKEN) {
	throw new Error("WEBHOOK_AUTH_TOKEN environment variable is required");
}
app.post("/webhook/strapi-update", bodyParser.json(), (req, res) => {
	// Basic authentication check
	const authHeader = req.headers.authorization;
	const expectedAuth = `Bearer ${process.env.WEBHOOK_AUTH_TOKEN}`;

	if (!authHeader || authHeader !== expectedAuth) {
		debug && console.log("Webhook authentication failed");
		return res.status(401).json({ error: "Unauthorized" });
	}

	debug && console.log("Webhook triggered by Strapi - starting content sync...");

	// Run the Strapi scan
	models.scanEveryTableStrapi(models.bases, function scanEveryTableCallback(data) {
		let filesUpdated = 0;
		Object.keys(data).forEach(function processFullDataCallback(key) {
			jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback(err) {
				if (debug && err) {
					console.error(`Error writing ${key}.json:`, err);
				} else {
					filesUpdated++;
					debug && console.log(`Updated ${key}.json with ${Object.keys(data[key]).length} records`);
				}
			});
		});
		debug && console.log(`Webhook scan complete! ${filesUpdated} files updated with Strapi data.`);
	});

	res.status(200).json({ success: true, message: "Content sync triggered successfully" });
});

app.use(bodyParser.urlencoded({ extended: false })); // Used for sending HTML form data within POST requests
app.use(cookieParser());
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
// 0 0 * * * -- every day at midnight

// CRON JOB DISABLED - Uncomment below to re-enable
/*
var job = new CronJob(
	"0 0 * * *",
	function () {
		debug && console.log("Cron job triggered - starting Strapi data sync...");
		// Actual scanning happens in routes/models.js. This function simply transfers the pulled data into JSON files.
		// Updated to use Strapi
		models.scanEveryTableStrapi(models.bases, function scanEveryTableCallback(data) {
			let filesUpdated = 0;
			Object.keys(data).forEach(function processFullDataCallback(key) {
				jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback(err) {
					if (debug && err) {
						console.error(`Error writing ${key}.json:`, err);
						throw new Error(err);
					} else {
						filesUpdated++;
						debug && console.log(`Updated ${key}.json with ${Object.keys(data[key]).length} records`);
					}
				});
			});
			debug && console.log(`Cron job successful! ${filesUpdated} files updated with Strapi data.`);
		});
	},
	function () {
		debug && console.log("Cron job stopped.");
	},
	true,
	"Pacific/Honolulu"
);
*/

// Initial One-Time Strapi Scan On Startup
debug && console.log("Running one-time Strapi scan on startup...");
models.scanEveryTableStrapi(models.bases, function scanEveryTableCallback(data) {
	let filesUpdated = 0;
	Object.keys(data).forEach(function processFullDataCallback(key) {
		jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback(err) {
			if (debug && err) {
				console.error(`Error writing ${key}.json:`, err);
				throw new Error(err);
			} else {
				filesUpdated++;
				debug && console.log(`Updated ${key}.json with ${Object.keys(data[key]).length} records`);
			}
		});
	});
	debug && console.log(`Startup scan complete! ${filesUpdated} files updated with Strapi data.`);
});
