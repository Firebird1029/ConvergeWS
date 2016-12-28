"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = false;

// DOM Animation Settings

// Fix scroll glitch
$(document).scrollTop(0);
$(window).on("beforeunload", function () {
	$(window).scrollTop(0);
});

// Navigation Dropotron Settings
$("#nav > ul").dropotron({
	// mode: "fade",
	// speed: 300,
	alignment: "center"
	// noOpenerFade: true
});

// Setup Variables
var socket = io.connect();

function directDOMChange (options, records) {
	var $domToChange, i,
		specialDoms = options.specialDomToChange || [];
	for (i = 0; i < specialDoms.length; i++) {
		$domToChange = $(specialDoms[i]); // The special, parent DOM element to work with.
		debug && console.log($domToChange.find(".dynamic"));
		$domToChange.find(".dynamic").each(function (index, element) {
			var $el = $(element), // The current child DOM element to work with.
				elClasses = $el.attr("class").split(" "); // The class list of the element.
			debug && console.log($el, elClasses);

			for (var j = 0; j < elClasses.length; j++) {
				var field = records[Object.keys(records)[i]][elClasses[j]];
				debug && console.log( records[Object.keys(records)[i]][elClasses[j]] );
				if (field) {
					// The class matches a field (or title of a column) in the Airtable records.
					// TODO deal with an array in an airtable record
					if (Array.isArray(field)) {
						$el.content(getFirstElement(field));
					} else {
						$el.content(field);
					}
				}
			}
		});
	}

	i = 0;
	Object.keys(records).forEach(function (key) {
		if (i < specialDoms.length) {
			i++;
			return;
		}
		$domToChange = $(options.domToChange); // The parent DOM element to work with.
		debug && console.log($domToChange.find(".dynamic"));
		$domToChange.find(".dynamic").each(function (index, element) {
			var $el = $(element), // The current child DOM element to work with.
				elClasses = $el.attr("class").split(" "); // The class list of the element.
			debug && console.log($el, elClasses);

			for (var j = 0; j < elClasses.length; j++) {
				var field = records[key][elClasses[j]];
				if (field) {
					// Animation
					$el.hide();

					// The class matches a field (or title of a column) in the Airtable records.
					// TODO deal with an array in an airtable record
					if (Array.isArray(field)) {
						$el.content(getFirstElement(field));
					} else {
						$el.content(field);
					}

					// Animation
					$el.fadeIn(1000); // TODO make dynamic
				}
			}
		});
	});
}

function insertTemplate (options, records) {
	Object.keys(records).forEach(function (key) {
		var $template = $("");

		if (records[key].style) {
			// There has been a template style specified in the Airtable record.
			var templateStyle = "template-" + records[key].style;
			debug && console.log(templateStyle);
			
			$template = $("div." + templateStyle).clone().removeClass(templateStyle); // TODO change to ID??
			$template.find(".dynamicTemplate").each(function (index, element) {
				var $el = $(element), // The current child DOM element to work with.
					elClasses = $el.attr("class").split(" "); // The class list of the element.
				debug && console.log($el, elClasses);
				// data[key][$el.attr("class")] && $el.content(data[key][$el.attr("class")]);
				
				for (var j = 0; j < elClasses.length; j++) {
					var field = records[key][elClasses[j]];
					if (field) {
						debug && console.log(field);
						// The class matches a field (or title of a column) in the Airtable records.
						// TODO deal with an array in an airtable record
						if (Array.isArray(field)) {
							debug && console.log(getFirstElement(field));
							$el.content(getFirstElement(field));
						} else {
							$el.content(field);
						}
					}
				}
			});
		}

		// Append to current view, with animation
		$template.hide();
		$template.appendTo($("div.container"));
		$template.fadeIn(500); // TODO make dynamic
	});
}

// Listen for when the server sends in the Airtable data
socket.on("refreshed", function (serverData) {
	if (!serverData.fileData) {
		throw new Error("File Data not received!");
	}
	debug && console.log(serverData);
	var options = serverData.options, // The preserved options that were emitted with originally.
		records = serverData.fileData; // The Airtable records inside the local JSON files.


	window[options.method](options, records); // Call the appropiate function based on the chosen method
	
});