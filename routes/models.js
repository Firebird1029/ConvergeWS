"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;

// Strapi code written by Claude

// Load Node Dependencies & Custom Modules
var path = require("path"),
	_ = require("lodash"),
	jsonfile = require("jsonfile"),
	validator = require("validator"),
	utils = require("../utils.js"),
	strapiService = require("../services/strapi.js");

// Strapi content structure - keeping minimal compatibility for existing routes
var bases = {
	"About Sections": {
		tables: ["Front Page", "History", "Values", "Team Leaders"]
	},
	"Community": {
		tables: ["Announcements", "Forms"]
	},
	"Experience": {
		tables: ["Calendar", "Photos"]
	},
	"Converge Listen": {
		tables: ["Listen"]
	},
	"Converge TV": {
		tables: ["Youtube Live", "Converge TV"]
	},
	"HE Brews": {
		tables: ["HE Brews", "Menu"]
	},
	"Articles and Blogs": {
		tables: ["Articles"]
	},
	"Past Sermons": {
		tables: ["Sermons"]
	}
}

// Fetch all Strapi content
async function scanEveryTableStrapi(bases, callback) {
	debug && console.log("Starting Strapi scan...");
	try {
		// Create a mapping of all table names to fetch from Strapi
		const tableMapping = {};

		// Convert the base structure to a flat table mapping
		Object.keys(bases).forEach(baseName => {
			bases[baseName].tables.forEach(tableName => {
				const fullTableName = `${baseName}_${tableName}`;
				tableMapping[fullTableName] = true;
			});
		});


		// Fetch all data from Strapi
		const fullData = await strapiService.fetchAllStrapiContent(tableMapping);

		const totalRecords = Object.values(fullData).reduce((sum, data) => sum + Object.keys(data).length, 0);
		debug && console.log(`Strapi scan complete: ${totalRecords} records from ${Object.keys(fullData).length} endpoints`);

		// Call the callback with the fetched data
		callback(fullData);
	} catch (error) {
		debug && console.error("Error scanning Strapi tables:", error);
		// Fallback to empty data on error
		callback({});
	}
}

// Create a Strapi record
async function createStrapiRecord(baseName, tableName, data, callback) {
	try {
		// Map base name and table name to Strapi content type
		const contentTypeMap = {
			"Contact Responses": {
				"More Info": "contact-submissions",
				"To Serve": "serve-submissions",
				"For Prayer": "prayer-requests",
				"Baptism and Confirmation": "baptism-confirmations",
				"Booking Time": "booking-requests"
			},
			"Devotions": {
				"Entries": "devotions"
			}
		};

		let contentType = null;
		if (contentTypeMap[baseName] && contentTypeMap[baseName][tableName]) {
			contentType = contentTypeMap[baseName][tableName];
		}

		if (!contentType) {
			debug && console.error(`No Strapi content type mapping found for ${baseName}_${tableName}`);
			throw new Error(`No Strapi content type mapping found for ${baseName}_${tableName}`);
		}


		// Create the record in Strapi
		const record = await strapiService.createStrapiRecord(contentType, data);

		debug && console.log(`Created record in ${contentType}:`, record.id || record.documentId);
		callback(record);
	} catch (error) {
		debug && console.error(`Error creating Strapi record for ${baseName}_${tableName}:`, error);
		throw error;
	}
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
		},

		// Devos Page
		fname: function () {
			!validator.isLength(userData.fname, {min: 1}) && (finalData.invalid.fname = "First name is required");
		},
		lname: function () {
			!validator.isLength(userData.lname, {min: 1}) && (finalData.invalid.lname = "Last name is required");
		},
		title: function () {
			!validator.isLength(userData.title, {min: 1}) && (finalData.invalid.title = "Title is required");
		},
		entry: function () {
			!validator.isLength(userData.entry, {min: 1}) && (finalData.invalid.entry = "Entry is required");
		},
		selection2: function () {
			!validator.isLength(userData.selection2, {min: 1}) && (finalData.invalid.selection2 = "Selection is required");
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
	// Devos Page
	if (finalData.fields.hasOwnProperty("publish") && finalData.fields.publish === "on") {
		finalData.fields.publish = true;
	}
	if (finalData.fields.hasOwnProperty("anonymous") && finalData.fields.anonymous === "on") {
		finalData.fields.anonymous = true;
	}

	// Delete fields not part of HTML form
	delete finalData.fields["g-recaptcha-response"]; // The reCAPTCHA is not an actual field, so delete it.
	delete finalData.fields["_csrf"]; // Regenerate a CSRF token every rendering.

	// After Validation & Sanitization
	finalData.passedValidation = !(_.size(finalData.invalid)); // If no invalid fields, data passed validation, vice versa.
	if (finalData.passedValidation) {
		// Create record in Strapi
		createStrapiRecord(baseName, tableName, finalData.fields, function finishedCreatingStrapiRecord (record) {
			return _.defaults({fields: {}}, finalData); // Clear input data
		});
	}
	return finalData;
}

module.exports = {
	bases: bases, // Object (kept for compatibility with existing structure)
	scanEveryTableStrapi: scanEveryTableStrapi, // Function (Strapi)
	createStrapiRecord: createStrapiRecord, // Function (Strapi)
	getFileData: getFileData, // Function
	defaultFormRender: defaultFormRender, // Object
	processForm: processForm // Function
}
