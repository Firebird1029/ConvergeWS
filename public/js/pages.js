"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

var redirections = {
	newHere: "index.html#firstContent",
	aboutConverge: "pages/about-converge.html"
}

$("#nav").find("a").each(function (index, element) {
	$(this).prop("href", redirections[$(this).prop("id").substring(8)] || "#"); // Removes "navlink-", then adds href property to a elements, which redirects to the appropriate page.
});