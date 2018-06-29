"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

/*
 * TODO
 * Create all the other pages of the website (layout?)
 *
 * Calendar: stage 4 (calendar Bulma extension)
 * Classes: stage 2 (Ministry-style)
 * Ministries: stage 1
 * Activities: stage 2
 * Photos: Photoswipe: stage 3
 * Authentic Peace: stage 5 (magazine style with left/right arrows + archive) https://bulma.io/documentation/components/pagination/
 * Sermons: stage 2, Ministry-style
 * More Info: Name, contact info, inquiry/interest
 * Serve: Name, ministry, other
 * Prayer: Name, request
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
	io = require("socket.io"),
	listener = io.listen(server),
	pugStatic = require("pug-static"),
	utils = require("./utils.js"),
	models = require("./routes/models.js"),

	jsonfile = require("jsonfile"),
	CronJob = require("cron").CronJob,
	airtable = require("airtable");

// Setup Airtable API
airtable.configure({ // Module for Airtable API.
	endpointUrl: "https://api.airtable.com",
	apiKey: "keyFUzYF3ZYAosZWm" // https://airtable.com/account
});

var bases = {
	"About Sections": {
		baseID: "appXpFAar7Nro7fRZ",
		tables: ["Front Page", "About CLCH", "About Converge", "CoYA"]
	},
	"About Staff": {
		baseID: "appj3Hm417P5gE0oM",
		tables: ["Leads"]
	},
	"Experience and Community": {
		baseID: "appkvA9WfE62DYGIl",
		tables: ["Calendar", "Classes", "Ministries", "Activities", "Photos", "Leaders"]
	},
	"Resources": {
		baseID: "appeBfEsO2Q2eEIMX",
		tables: ["Authentic Peace", "Helps"]
	},
	"Articles and Blogs": {
		baseID: "appaTv4YjcvFV6f4l",
		tables: ["Posts", "Authors"]
	},
	"HE brews": {
		baseID: "appamTiUaVqXSiBhf",
		tables: ["HE brews", "Menu"]
	}
}

// Express Middleware
app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));
var router = require("./routes/routes.js");
// app.use(pugStatic(__dirname + "/views"));
app.use("/", router);

// Playground
// scanTable("appXpFAar7Nro7fRZ", "Front Page", function (error, dataToSend) {})

// Airtable: Scan Table
function scanTable (baseID, tableName, callback) {
	var dataToSend = {},
		base = airtable.base(baseID),
		table = base(tableName);
	table.select({
		view: "Main View"
	}).eachPage(function processPage (records, fetchNextPage) {
		records.forEach(function processRecord (record) {
			// "record.id" to get ID, "record.fields" to get object literal, "record.get('FIELD NAME')" to get value.
			dataToSend[record.id] = record.fields;
		});
		fetchNextPage();
	}, function doneProcessing (err) {
		if (debug && err) { throw new Error(err); }
		// debug && console.log(`Table ${tableName} successfully scanned!`);
		callback(dataToSend);
	});
}

// Airtable: Scan Every Table
function scanEveryTable (bases, callback) {
	var fullData = {}; // This is where all the data will be temporarily stored.
	// Loop through the bases.
	utils.waterfallOverObject(bases, function waterfallOverObjectCallback (base, report) {
		// Loop through the tables of each base.
		utils.waterfallOverArray(bases[base].tables, function waterfallOverArrayCallback (table, innerReport) {
			// Scan each table.
			scanTable(bases[base].baseID, table, function scanTableCallback (data) {
				fullData[`${base}_${table}`] = data; // Add the scanned data to the fullData object.
				innerReport(); // Move on to the next table.
			});
		}, function finishedWaterfallingOverTables () {
			report(); // Move on to the next base.
		});
	}, function finishedWaterfallingOverBases () {
		callback(fullData); // Send the data back to the cron job.
	});

}

// Scheduling By Cron Job
// 00 */2 * * * * -- every 2 hours
// */6 * * * * * -- every 10 seconds
// */12 * * * * * -- every 5 seconds
var job = new CronJob("* * * * * *", function () {
	scanEveryTable(bases, function scanEveryTableCallback (data) {			
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