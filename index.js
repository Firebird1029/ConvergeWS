"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

/*
 * TODO
 * Create all the other pages of the website (layout?)
 * Add logo to navbar
 * Fuzzy string matching + TextRazor NLP API (stage 9)
 * 
 * Calendar: stage 4 (calendar Bulma extension)
 * Photos: Photoswipe: stage 3
 * Authentic Peace: stage 5 (magazine style with left/right arrows + archive) https://bulma.io/documentation/components/pagination/
 *
 * Next:
 * Add phone number, address, etc to footer
 * Show He brews
 * Show multiline (%), adding bold content
 * Heroku temporary
*/

// Load Node Modules & Custom Modules
var express = require("express"),
	app = express(),
	server = app.listen(process.env.PORT || (process.argv[2] || 8000), function expressServerListening () {
		console.log(server.address());
	}),

	helmet = require("helmet"),
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	bodyParser = require("body-parser"),
	csrf = require("csurf"),
	pugStatic = require("pug-static"),

	CronJob = require("cron").CronJob,
	jsonfile = require("jsonfile"),
	io = require("socket.io"),
	listener = io.listen(server),

	_ = require("lodash"),
	utils = require("./utils.js"),
	router = require("./routes/routes.js"),
	models = require("./routes/models.js");

// Express Middleware
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
app.use(bodyParser.urlencoded({extended: false}));
app.use(csrf({cookies: true}));

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));
// app.use(pugStatic(__dirname + "/views"));

app.use("/", router);
app.use((req, res, next) => {
	res.status(404).render("404.pug");
});

// Scheduling By Cron Job
// 00 */2 * * * * -- every 2 hours
// */6 * * * * * -- every 10 seconds
// */12 * * * * * -- every 5 seconds
var job = new CronJob("*/12 * * * * *", function () {
	models.scanEveryTable(models.bases, function scanEveryTableCallback (data) {			
			// Process Full Data
			Object.keys(data).forEach(function processFullDataCallback (key) {
				jsonfile.writeFile(`${__dirname}/models/${key}.json`, data[key], function jsonWriteFileCallback (err) {
					if (debug && err) { throw new Error(err); }
				});
			});
			// debug && console.log(`Cron job successful! Files ${__dirname}/models/*.json updated.`);
	});
}, function () {
	console.log("Cron job stopped.");
}, true, "Pacific/Honolulu");

// Socket.io Control
listener.sockets.on("connection", function connectionDetected (socket) {
	socket.on("refreshRequest", function processRefreshRequest (options) {
		models.getFileData(options.base, options.table, function gotFileData (fileData) {
			socket.emit("refreshResponse", fileData);
		});
	});
});
