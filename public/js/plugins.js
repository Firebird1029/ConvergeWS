// Avoid `console` errors in browsers that lack a console.
(function() {
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());

// Place any jQuery/helper plugins in here.

$.fn.content = function (contents, options) {
	var settings = $.extend({
		arrayJoiner: ", ", // If contents is passed as an array, how should the array be joined?
		htmlInstead: false // Use .html() instead of .text()
	}, options);

	this.each(function (index, element) {
		var el = $(element);
		// For regular elements.
		if (el.is("a, b, i, u, strong, em, span, p, div, h1, h2, h3, h4, h5, h6, button")) {
			if (settings.htmlInstead) {
				// This can be set by passing options to this plugin.
				el.html(contents);
			} else {
				if (typeof contents === "string") {
					// Contents is a string, so simply set the text of the element to contents.
					el.text(contents);
				} else if (Array.isArray(contents)) {
					// Contents is an array, so join the array, then set the text of the element to the joined array.
					el.text(contents.join(settings.arrayJoiner));
				}
			}
		}

		// For images. Make sure contents is a string before setting the image source.
		if (el.is("img")) {
			if (typeof contents === "string") {
				// Just a regular string.
				el.attr("src", contents);
			} else {
				// Might be an object. TODO what if not an object?
				el.attr("src", contents.url);
			}
		}
	});

	return this;
}

function getFirstElement (list) {
	if (Array.isArray(list[0])) {
		getFirstElement(list[0]);
	} else {
		return list[0];
	}
}

/*

function getFirstElement (list) {
	if (list !== null && typeof list === "object") {
		if (Array.isArray(list[0])) {
			getFirstElement(list[0]);
		} else {
			getFirstElement(Object.keys(list)[0]);
		}
	} else {
		return list[0];
	}
}

*/