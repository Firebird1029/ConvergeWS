"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// ADJUSTABLE - Change these variables if Airtable base structure changes (added fields, changed name of table, etc.)
var apiKey = "keyFUzYF3ZYAosZWm", // https://airtable.com/account - TODO We need a universal API key.
								  // https://airtable.com/api
	tableName = "Leads",
	tableView = "Main View",
	customSort = [], // See table.select parameters for custom sort settings. This variable can also be user-controlled TODO.
	bases = {
		"About Sections": {
			baseID: "appXpFAar7Nro7fRZ",
			tables: ["Front Page", "About Converge", "CoYA Mission", "CLCH Mission", "Settings"]
		},
		"About Staff": {
			baseID: "appj3Hm417P5gE0oM",
			tables: ["Leads"]
		},
		"Sitewide Settings": {
			baseID: "appYS8E1z23NKbFtH",
			tables: ["Settings"]
		}
	};

// Setup Node Modules
var express = require("express"),
	app = express(),
	server = app.listen(process.argv[2] || 8000, function expressServerListening () {
		console.log(server.address());
	}),
	io = require("socket.io"),
	listener = io.listen(server),
	jsonfile = require("jsonfile"),
	CronJob = require("cron").CronJob;

// Setup Airtable API
var airtable = require("airtable");

airtable.configure({ // Module for Airtable API.
	endpointUrl: "https://api.airtable.com",
	apiKey: apiKey // https://airtable.com/account
});

// var base = airtable.base(baseIDs["About Staff"].baseID),
// 	table = base(tableName);

// Express Framework
app.use(express.static("public"));

// Airtable: Scan Table
function scanTable (baseID, tableName, callback) {
	var dataToSend = {},
		base = airtable.base(baseID),
		table = base(tableName);
	table.select({
		// maxRecords: 100, // Optional: The maximum total number of records that will be returned.
		pageSize: 100, // Optional: The number of records returned in each request. Must be less than or equal to 100. Default is 100.
		/* Optional: A list of sort objects that specifies how the records will be ordered.
		 * Each sort object must have a field key specifying the name of the field to sort on, and an optional direction key that is either "asc" or "desc".
		 * The default direction is "asc". If you set the view parameter, the returned records in that view will be sorted by these fields.
		 * {field: "Name", direction: "desc"}
		*/
		sort: customSort,
		view: tableView // Optional: The name or ID of a view in the table. If set, only the records in that view will be returned.
						// The records will be sorted according to the order of the view.
	}).eachPage(
	function processPage (records, fetchNextPage) {
		records.forEach(function processRecord (record) {
			// "record.id" to get ID, "record.fields" to get object literal, "record.get('FIELD NAME')" to get value.
			// console.log(record.fields);
			dataToSend[record.id] = record.fields;
		});

		fetchNextPage();
	},
	function doneProcessing (error) {
		(debug && !error) && console.log(error || `Table ${tableName} successfully scanned!`);
		callback(error, dataToSend);
	});
}

// Massive TODO: Change from Waterfall Method to Promise-Based Method
/*
 * https://mostafa-samir.github.io/async-iterative-patterns-pt1/
 * https://mostafa-samir.github.io/async-recursive-patterns-pt2/
 * https://www.npmjs.com/package/q#the-beginning
 * https://davidwalsh.name/promises
 * http://stackoverflow.com/questions/32912459/promises-pass-additional-parameters-to-then-chain
 * https://glebbahmutov.com/blog/passing-multiple-arguments-in-promises/
 * https://daveceddia.com/waiting-for-promises-in-a-loop/
 */

// https://mostafa-samir.github.io/async-iterative-patterns-pt1/
function waterfallOverArray (list, iterator, callback) {
	var nextItemIndex = 0;  //keep track of the index of the next item to be processed
	function report () {
		nextItemIndex++;
		// if nextItemIndex equals the number of items in list, then we're done
		if(nextItemIndex === list.length)
			callback();
		else
			// otherwise, call the iterator on the next item
			iterator(list[nextItemIndex], report);
	}
	// instead of starting all the iterations, we only start the 1st one
	iterator(list[0], report);
}

// Modified version of the original WaterfallOver object, to iterate through objects instead of arrays.
function waterfallOverObject (obj, iterator, callback) {
	var nextItemIndex = 0;  //keep track of the index of the next item to be processed
	function report () {
		nextItemIndex++;
		// if nextItemIndex equals the number of items in object, then we're done
		if(nextItemIndex === Object.keys(obj).length)
			callback();
		else
			// otherwise, call the iterator on the next item
			iterator(Object.keys(obj)[nextItemIndex], report);
	}
	// instead of starting all the iterations, we only start the 1st one
	iterator(Object.keys(obj)[0], report);
}

// Airtable: Scan Every Table
function scanEveryTable (bases, callback) {
	var fullData = {}, // This is where all the data will be temporarily stored.
		errors = [];

	// Loop through the bases.
	waterfallOverObject(bases, function waterfallOverObjectCallback (base, report) {

		// Loop through the tables of each base.
		waterfallOverArray(bases[base].tables, function waterfallOverArrayCallback (table, innerReport) {

			// Scan each table.
			scanTable(bases[base].baseID, table, function scanTableCallback (error, data) {
				(debug && !error) && console.log(error || `Table ${table} from Base ${base} has been successfully scanned!`);
				error && errors.push(error); // Record errors if any.
				fullData[`${base}_${table}`] = data; // Add the scanned data to the fullData object.
				
				innerReport(); // Move on to the next table.
			});
		}, function finishedWaterfallingOverTables () {
			report(); // Move on to the next base.
		});
	}, function finishedWaterfallingOverBases () {
		callback(errors, fullData); // Send the data back to the cron job.
	});

}

// Scheduling By Cron Job
// 00 */2 * * * * -- every 2 hours
// */6 * * * * * -- every 10 seconds
// */12 * * * * * -- every 5 seconds
var job = new CronJob("00 * * * * *", function () {
	scanEveryTable(bases, function scanEveryTableCallback (errors, data) {
			// TODO process errrors
			
			// Process Full Data
			Object.keys(data).forEach(function processFullDataCallback (key) {
				jsonfile.writeFile(`${__dirname}/bases/${key}.json`, data[key], function jsonWriteFileCallback (err) {
					(debug && !err) && console.log(err || `Cron job successful! File ${__dirname}/bases/${key}.json updated.`);
				});
			});
	});
}, function () {
	console.log("Cron job stopped.");
}, true, "Pacific/Honolulu");

// Socket.io Control
listener.sockets.on("connection", function connectionDetected (socket) {
	socket.on("refreshRequest", function refreshRequestRecieved (options) {
		jsonfile.readFile(`${__dirname}/bases/${options.base}_${options.table}.json`, function jsonReadFileCallback (error, fileData) {
			// TODO handle error
			
			var dataToSend = {
				options: options, // Preserve options when sending back data.
				fileData: fileData
			};
			socket.emit("refreshed", dataToSend);
		});
	});
});