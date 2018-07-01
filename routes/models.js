"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var path = require("path"),
	_ = require("lodash"),
	jsonfile = require("jsonfile"),
	airtable = require("airtable"),
	validator = require("validator"),
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

function createAirtableRecord (baseID, tableName, data, callback) {
	var base = airtable.base(baseID),
		table = base(tableName);

	table.create(data, function (err, record) {
			if (debug && err) { throw new Error(err); }
			callback(record);
	});
}

// Get Data From JSON Model
function getFileData (base, table, callback) {
	jsonfile.readFile(path.join(__dirname, `../models/${base}_${table}.json`), function jsonReadFileCallback (err, fileData) {
		if (debug && err) { throw new Error(err); }
		callback(fileData);
	});
}

// Default Form Render Object (Default keys/values to pass back to client-side)
var defaultFormRender = {fields: {}, invalid: {}};

// Process User-Submitted Form (Validate, Sanitize)
// https://www.w3schools.com/tags/att_input_type.asp
// https://www.sitepoint.com/forms-file-uploads-security-node-express/
function processForm (baseName, tableName, userData, sysData) {
	var finalData = Object.assign({}, defaultFormRender); // Duplicate defaultFormRender object
	finalData.fields = Object.assign({}, userData); // Preserve user data to automatically re-input when page refreshed
	finalData.invalid = {}; // Reset invalid fields, to go through validation processing again

	// Validation
	!validator.isLength(userData.name, {min: 1}) && (finalData.invalid.name = "Name is required");
	!validator.isEmail(userData.email) && (finalData.invalid.email = "Email is invalid");
	!validator.isLength(userData.email, {min: 1}) && (finalData.invalid.email = "Email is required");
	!(validator.isEmpty(userData.phone) || validator.isMobilePhone(userData.phone, "any")) && (finalData.invalid.phone = "Phone number is invalid");
	!validator.isLength(userData.message, {min: 1}) && (finalData.invalid.message = "Inquiry is required");

	// reCAPTCHA
	if (!sysData.reCaptcha) {
		// Failed reCAPTCHA
		finalData.invalid.reCaptcha = "reCAPTCHA is invalid";
	}

	// Delete non-fields
	delete finalData.fields["g-recaptcha-response"]; // The reCAPTCHA is not an actual field, so delete it.
	delete finalData.fields["_csrf"]; // Regenerate a CSRF token every rendering.

	finalData.passedValidation = !(_.size(finalData.invalid)); // If no invalid fields, data passed validation, vice versa.
	if (finalData.passedValidation) {
		// Create record in Airtable
		createAirtableRecord(bases[baseName].baseID, tableName, finalData.fields, function finishedCreatingAirtableRecord (record) {
			return _.defaults({fields: {}}, finalData); // Clear input data
		});
	}
	return finalData;
}

module.exports = {
	bases: bases, // Object
	scanTable: scanTable,
	scanEveryTable: scanEveryTable,
	createAirtableRecord: createAirtableRecord,
	getFileData: getFileData,
	defaultFormRender: defaultFormRender, // Object
	processForm: processForm
}