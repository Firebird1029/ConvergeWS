"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;

// Load Node Dependencies & Custom Modules
var path = require("path"),
	_ = require("lodash"),
	jsonfile = require("jsonfile"),
	airtable = require("airtable"),
	validator = require("validator"),
	utils = require("../utils.js");

// Setup Airtable API
airtable.configure({ // Module for Airtable API.
	endpointUrl: "https://api.airtable.com",
	apiKey: process.env.AIRTABLE_KEY // https://airtable.com/account
});

// Bases To Pull From Airtable
// https://airtable.com/api to get base ID.
var bases = {
	"About Sections": {
		baseID: "appXpFAar7Nro7fRZ",
		tables: ["Front Page", "History", "Values"]
	},
	"About Staff": {
		baseID: "appj3Hm417P5gE0oM",
		tables: ["Staff"]
	},
	"Community": {
		baseID: "appkvA9WfE62DYGIl",
		tables: ["Jitsi", "Announcements", "Youth", "CoYA", "Ministries", "Forms", "Leaders"]
	},
	"Experience": {
		baseID: "appk80veA6WdxCrtB",
		tables: ["Calendar", "Classes", "Photos", "Leaders"]
	},
	"HE Brews": {
		baseID: "appamTiUaVqXSiBhf",
		tables: ["HE Brews", "Menu"]
	},
	"Converge TV": {
		baseID: "appFX7NBTY8z4Dqfb",
		tables: ["Converge TV", "Topics", "Speakers"]
	},
	"Past Sermons": {
		baseID: "appwoW5IMGdHcKf14",
		tables: ["Sermons", "Speakers", "Series"]
	},
	"Articles and Blogs": {
		baseID: "appaTv4YjcvFV6f4l",
		tables: ["Authentic Peace", "Posts", "Authors"]
	},
	"Contact Responses": {
		baseID: "app5uJTO5UJ1AMpiD",
		tables: ["More Info", "To Serve", "For Prayer", "Baptism and Confirmation"]
	},
	"Storefront": {
		baseID: "appj9yKh2t3Qh24Wl",
		tables: ["Storefront", "Contact"]
	}
}

// Airtable: Scan Table
function scanTable (baseID, tableName, callback) {
	var dataToSend = {},
		base = airtable.base(baseID),
		table = base(tableName);
	table.select({
		view: "Main View" // This is a common cause for an error, since creating a new Airtable table sets the view as "Grid view" not "Main View".
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

// Airtable: Create a Record in a Table
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
// https://github.com/chriso/validator.js
// https://www.w3schools.com/tags/att_input_type.asp
// https://www.sitepoint.com/forms-file-uploads-security-node-express/
function processForm (baseName, tableName, userData, sysData) {
	// baseName and tableName will be used to determine which base & table to create a record in.
	// userData is the HTML form data that the user has submitted, in object format.
	// sysData is server-side data about which fields need to be validated, and also contains the reCAPTCHA result.
	// The reCAPTCHA result is determined in routes.js rather than models.js because reCAPTCHA is not part of any model processing.
	var finalData = Object.assign({}, defaultFormRender); // Duplicate defaultFormRender object
	finalData.fields = Object.assign({}, userData); // Preserve user data to automatically re-input when page refreshed
	finalData.invalid = {}; // Reset any invalid fields if this is the second time form is being processed (fields need to go through validation again)

	// Validation
	var validation = {
		name: function () {
			!validator.isLength(userData.name, {min: 1}) && (finalData.invalid.name = "Name is required");
		},
		selection: function () {
			!validator.isLength(userData.selection, {min: 1}) && (finalData.invalid.selection = "Selection is required");
		},
		email: function () {
			!validator.isEmail(userData.email) && (finalData.invalid.email = "Email is invalid");
			!validator.isLength(userData.email, {min: 1}) && (finalData.invalid.email = "Email is required");
		},
		phone: function () {
			!(validator.isEmpty(userData.phone) || validator.isMobilePhone(userData.phone, "any")) && (finalData.invalid.phone = "Phone number is invalid");
		},
		message: function () {
			!validator.isLength(userData.message, {min: 1}) && (finalData.invalid.message = "Message is required");
		}
	}

	// Iterate through the expected fields, and validate them.
	for (var i = 0; i < sysData.expectedFields.length; i++) {
		validation[sysData.expectedFields[i]]();
	}

	// reCAPTCHA
	if (!sysData.reCaptcha) {
		// Failed reCAPTCHA
		finalData.invalid.reCaptcha = "reCAPTCHA is invalid";
	}

	// Sanitization

	// Delete fields not part of HTML form
	delete finalData.fields["g-recaptcha-response"]; // The reCAPTCHA is not an actual field, so delete it.
	delete finalData.fields["_csrf"]; // Regenerate a CSRF token every rendering.

	// After Validation & Sanitization
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
	scanTable: scanTable, // Function
	scanEveryTable: scanEveryTable, // Function
	createAirtableRecord: createAirtableRecord, // Function
	getFileData: getFileData, // Function
	defaultFormRender: defaultFormRender, // Object
	processForm: processForm // Function
}
