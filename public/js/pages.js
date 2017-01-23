"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

var redirections = {
	newHere: "/index.html#firstContent",
	aboutConverge: "/pages/about-converge.html",
	aboutCLCH: "/pages/about-clch.html",
	aboutCoYA: "/pages/about-coya.html",
	aboutPJ: "/pages/about-pastor-jason.html",
	aboutLW: "/pages/about-lead-worshippers.html",
	calendar: "/pages/calendar.html",
	bibleStudies: "/pages/bible-studies.html",
	classes: "/pages/classes.html",
	ministries: "/pages/ministries.html",
	activities: "/pages/activities.html",
	photos: "/pages/photos.html",
	hebrews: "/pages/hebrews.html",
	resources: "/pages/resources.html",
	dailyDevotion: "/pages/daily-devotion.html",
	sermons: "/pages/sermons.html",
	articlesBlogs: "/pages/articles-and-blogs.html",
	connect: "/pages/connect.html",
	moreInfo: "/pages/moreInfo.html",
	serve: "/pages/serve.html",
	prayer: "/pages/prayer.html"
}

$("#nav").find("a").each(function (index, element) {
	$(this).prop("href", redirections[$(this).prop("id").substring(8)] || "#"); // Removes "navlink-", then adds href property to a elements, which redirects to the appropriate page.
});