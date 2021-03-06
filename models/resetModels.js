// This file, which runs at the NPM postinstall build step, creates all the necessary JSON files with names that match the Airtable base & table names.
var fs = require("fs"),
	path = require("path"),
	models = require("../routes/models.js");

Object.keys(models.bases).forEach((base) => {
	for (var i = 0; i < models.bases[base].tables.length; i++) {
		fs.writeFile(path.join(__dirname, `${base}_${ models.bases[base].tables[i] }.json`), "{}", "utf8", function (err) {
			if (err) { return console.log(err); }
		});
	}
});

console.log("All models reset to {}.");
