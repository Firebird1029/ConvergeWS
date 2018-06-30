"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var path = require("path"),
	_ = require("lodash"),
	jsonfile = require("jsonfile"),
	airtable = require("airtable"),
	utils = require("../utils.js");

// Setup Airtable API
airtable.configure({ // Module for Airtable API.
	endpointUrl: "https://api.airtable.com",
	apiKey: "keyFUzYF3ZYAosZWm" // https://airtable.com/account
});

// Bases To Pull From Airtable
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
	"Sermons": {
		baseID: "appwoW5IMGdHcKf14",
		tables: ["Sermons", "Speakers", "Series"]
	},
	"HE brews": {
		baseID: "appamTiUaVqXSiBhf",
		tables: ["HE brews", "Menu"]
	},
	"Contact Responses": {
		baseID: "app5uJTO5UJ1AMpiD",
		tables: ["More Info", "Serve", "Prayer Requests"]
	}
}

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

// Get Data From JSON Model
function getFileData (base, table, callback) {
	jsonfile.readFile(path.join(__dirname, `../models/${base}_${table}.json`), function jsonReadFileCallback (err, fileData) {
		if (debug && err) { throw new Error(err); }
		callback(fileData);
	});
}

// Process User-Submitted Form (Validate, Sanitize)
function processForm () {
	// 
}

module.exports = {
	bases: bases,
	scanTable: scanTable,
	scanEveryTable: scanEveryTable,
	getFileData: getFileData,
	processForm: processForm
}