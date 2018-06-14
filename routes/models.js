"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = true;

// Load Node Modules & Custom Modules
var path = require("path"),
	jsonfile = require("jsonfile");

// Get Data From JSON Model
function getFileData (base, table, callback) {
	jsonfile.readFile(path.join(__dirname, `../models/${base}_${table}.json`), function jsonReadFileCallback (err, fileData) {
		if (debug && err) { throw new Error(err); }
		callback(fileData);
	});
}

module.exports = {
	getFileData: getFileData
}