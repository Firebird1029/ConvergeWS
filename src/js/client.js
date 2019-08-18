"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

// Bulma Navbar Burger
$(document).ready(function() {
	var scrollToPos, lastSavedScrollPos = 0;
	// Check for click events on the navbar burger icon
	$(".navbar-burger").click(function() {
		// This two-var algorithm does this:
		// If mobile nav menu is off and being toggled on, then scroll to top, else if being toggled off, restore old scroll position
		// If the user is not already at the top of the page when mobile nav menu is being toggled on, menu will appear at top of page, not to user
		lastSavedScrollPos = ($("article.article").is(":visible")) ? window.scrollY : lastSavedScrollPos;
		scrollToPos = ($("article.article").is(":visible")) ? 0 : lastSavedScrollPos;

		// Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
		$(".navbar-burger").toggleClass("is-active");
		$(".navbar-menu").toggleClass("is-active");
		$(".navbar").toggleClass("is-desktop"); // Fixes glitch where mobile nav menu can't scroll
		$(".navbarDropdownTitle").toggleClass("is-strong"); // So users will hopefully stop tapping the unlinked dropdown titles
		// 
		$(".hero-body, article.article").toggle(); // Stylistic choice, since nav hamburger is fixed at bottom of screen
		window.scrollTo(0, scrollToPos);
	});
});

// Home Page Map (Google Maps)
function initMap () {
	var clchCoordinates = {lat: 21.322523, lng: -157.859298};
	var map = new google.maps.Map($("#map")[0], {
		zoom: 15,
		center: clchCoordinates
	});

	var marker = new google.maps.Marker({
		position: clchCoordinates,
		map: map,
		title: "CLCH"
	});
}

// Home Page Video
if ($("#frontPageHero").length) {
	var instance = new vidbg("#frontPageHero", {
		mp4: "assets/img/night.mp4", // URL or relative path to MP4 video
		// webm: "path/to/video.webm", // URL or relative path to webm video
		poster: "assets/img/decal_large.jpg", // URL or relative path to fallback image
		overlay: false, // Boolean to display the overlay or not
		// overlayColor: "#000", // The overlay color as a HEX
		// overlayAlpha: 0.3 // The overlay alpha. Think of this as the last integer in RGBA()
	}, {
		// Attributes
	});
}

// Go to Welcome Section on Home Page When Nav Button is Clicked
function jumpToWelcome () {
	if ($("#welcome").length) {
		// If on home page, scroll to Welcome section
		$("html, body").animate({
			scrollTop: $("#welcome").offset().top
		}, 1000);
	} else {
		// If not on home page, redirect user
		window.location.href = "/index.html#welcome";
	}
	return false;
}

// Add Background Behind Navbar (if full navbar is present)
// https://stackoverflow.com/questions/7182342/how-to-detect-when-the-user-has-scrolled-to-a-certain-area-on-the-page-using-jqu
$(window).on("load resize", function () {
	if ($(".navbar-burger").is(":hidden")) {
		// Desktop view since the navbar-burger only shows on mobile devices
		if ($(".hero-body > .container > h1").length) {
			// If it contains a regular heading at the top of the page and not a full height hero, add the navbar background automatically.
		$(".navbar").addClass("navbarBackground");
		} else {
			$(".navbar").addClass("navbarBackground");


			// With vidbg and a full background video, the navbar might not be visible against certain backgrounds, so show the background all the time.
			/*
			// If it contains a full height hero with no text heading, add the navbar background after scrolling past the hero.
			$(document).on("scroll", function () {
				if($(this).scrollTop() >= $(".hero-foot").position().top) {
					// User scrolled past the full height hero.
					$(".navbar").addClass("navbarBackground");
				} else {
					// Top of user's screen is above the bottom of the full height hero.
					$(".navbar").removeClass("navbarBackground");
				}
			});
			*/
		}
	}
});

// Collapsible Tiles
$(".collapsibleButton").each((index, collBtnEl) => {
	var boxID = $(collBtnEl).data("boxgroup"); // This will distinguish between different collapsible tiles.
	$(collBtnEl).click(() => {
		// When a collapsible button is pressed, toggle the color of the correlated collapsible heading.
		$(".collapsibleHeading[data-boxgroup=" + boxID + "]").toggleClass("has-text-grey");
		// Then, toggle the visibility of all the related collapsible content.
		$(".collapsibleContent[data-boxgroup=" + boxID + "]").each((index, collContEl) => {
			if ($(collContEl).css("maxHeight") === "0px") {
				// Content was hidden/collapsed, will now show content
				$(collContEl).css("maxHeight", "" + $(collContEl).prop("scrollHeight") + "px");
			} else {
				// Content was being shown, will now hide/collapse
				$(collContEl).css("maxHeight", "0px");
			}
		});
	});
});

// Photoswipe
$(".gallery").each(function (index, galleryElement) {
	var galleryID = $(galleryElement).data("boxgroup");
	var galleryContainer = []; // Init empty gallery array

	// Loop over gallery pictures and push it to the array
	$(galleryElement).find("a.photoswipeElement[data-boxgroup=" + galleryID + "]").each(function () {
		galleryContainer.push({
			src: $(this).attr("href"),
			w: $(this).data("width"),
			h: $(this).data("height"),
			title: $(this).data("caption")
		});
	});

	// Define click event on each gallery picture
	$("a.photoswipeElement[data-boxgroup=" + galleryID + "]").click(function (event) {
		event.preventDefault(); // Prevent location change
		// Define Photoswipe DOM object
		var $pswp = $(".pswp[data-boxgroup=" + galleryID + "]")[0];
		// Initialize PhotoSwipe
		var gallery = new PhotoSwipe($pswp, PhotoSwipeUI_Default, galleryContainer, {
			// Options
			index: Number($(this).data("picindex")), // This correlates the order of the DOM pictures with the gallery pictures.
			bgOpacity: 0.85,
			showHideOpacity: true
		});
		gallery.init();
	});
});

// Calendar
if ($(".hello-week").length) {
	// https://github.com/maurovieirareis/hello-week
	// https://maurovieirareis.github.io/hello-week/demos/documentation.html
	var helloWeek = new HelloWeek({
		selector: ".hello-week",
		lang: "hello-week-en",
		langFolder: "./lib.preferences/",
		format: "mm/dd/yyyy",
		onLoad: () => {
			calendarLoaded();
			calendarUpdated();
		},
		onChange: calendarUpdated,
		onSelect: calendarUpdated,
		onClear: calendarUpdated
	});

	// Every time visual calendar is clicked
	function calendarUpdated () {
		// When switching between months, re-add small dot under events
		// This is the same code as in the calendarLoaded function
		$(".event").each(function (eventIndex, eventEl) {
			// Match up events pulled from Airtable with visual calendar days and add a visual small circle
			var eventDate = new Date($(eventEl).find(".eventDate").text());
			eventDate.setUTCHours(10); eventDate.setUTCMinutes(0); // Temporarily reset time of events to match timestamp given by Hello-Week DOM elements (10 am GMT).
			eventDate = eventDate.getTime() / 1000; // Convert to Epoch timestamp. https://www.epochconverter.com/
			// Add a small dot/circle under each day in visual calendar when there is an event
			$(".hello-week__day[data-timestamp=" + eventDate + "]").addClass("calendarDayDot");
		});

		// The rows in the Event List that correspond to the clicked date in visual calendar
		var $selectedDaysInList = $(".event:contains(" + helloWeek.selectedDays[0] + ")");

		if ($selectedDaysInList.length === 1) {
			// One event on the selected calendar day.

			// Trigger a click on the event in the list to cause the Event Details to show.
			$selectedDaysInList.eq(0).click();
			// Scroll to the event in the event list. https://stackoverflow.com/questions/635706/how-to-scroll-to-an-element-inside-a-div
			$("#eventCalendarList").animate({
				scrollTop: $("#eventCalendarTable").scrollTop() + $selectedDaysInList.eq(0).position().top
			}, 200);
		} else if ($selectedDaysInList.length > 1) {
			// Multiple events on the selected calendar day.

			// Styling: Highlight the multiple events in the event list.
			$(".event").each(function () { $(this).removeClass("calendarAddSelectedColor"); }); // Reset highlighting in Event List.
			$selectedDaysInList.each(function () { $(this).addClass("calendarAddSelectedColor"); }); // Add highlighting to the multiple events in Event List.
			// Scroll to the events in the event list.
			$("#eventCalendarList").animate({
				scrollTop: $("#eventCalendarTable").scrollTop() + $selectedDaysInList.eq(0).position().top
			}, 200);

			// Give a message in the Event Details.
			$(".eventDetails").each(function () { $(this).text("").hide(); }); // Reset text in Event Details.
			$("#eventDetailsBody").text("Multiple events on " + helloWeek.selectedDays[0] + "! Select an event from the list below.").show();
		} else {
			// No event on the selected calendar day, so reset styling.
			$(".eventDetails").each(function () { $(this).text("").hide(); }); // Reset text in Event Details.
			$(".event").each(function () { $(this).removeClass("calendarAddSelectedColor"); }); // Reset highlighting in Event List.
		}
	}

	// Once visual calendar has loaded
	function calendarLoaded () {
		$(".event").each(function (eventIndex, eventEl) {
			// Match up events pulled from Airtable with visual calendar days and add a visual small circle
			var eventDate = new Date($(eventEl).find(".eventDate").text());
			eventDate.setUTCHours(10); eventDate.setUTCMinutes(0); // Temporarily reset time of events to match timestamp given by Hello-Week DOM elements (10 am GMT).
			eventDate = eventDate.getTime() / 1000; // Convert to Epoch timestamp. https://www.epochconverter.com/
			// Add a small dot/circle under each day in visual calendar when there is an event
			$(".hello-week__day[data-timestamp=" + eventDate + "]").addClass("calendarDayDot");

			// If link in calendar event list (below visual calendar) is clicked, show event details for the event clicked
			$(eventEl).click(function() {
				// Styling: change color of event in list when clicked on
				$(".event").each(function () { $(this).removeClass("calendarAddSelectedColor"); }); // Reset highlighting.
				$(eventEl).addClass("calendarAddSelectedColor");

				// Styling: update selected day of the visual calendar
				$(".hello-week__day").each(function () { $(this).removeClass("is-selected"); });
				$(".hello-week__day[data-timestamp=" + eventDate + "]").addClass("is-selected");

				// Instead of using Socket.IO (server <--> client), data of each record is stored directly in the DOM (server --> DOM <--> client).
				var recordData = $(eventEl).data("record");

				// If event selected is different from event already being shown, reset text and animations.
				if ($("#eventDetailsTitle") !== recordData.title) {
					$(".eventDetails").each(function () { $(this).text("").hide(); });
				}

				// Set the values of the Event Details column
				$("#eventDetailsTitle").text(recordData.title || "");
				$("#eventDetailsMinistry").text((recordData.ministry) ? recordData.ministry + " Ministry" : "");
				$("#eventDetailsBody").text(recordData.body || "");

				// Options for formatting the date & time from a JS Date object.
				var dateLocaleOptions = {timeZone: "Pacific/Honolulu", hour12: true, hour: "numeric", minute: "numeric"};

				// Ternary operator. If true, then convert the string to a Date object, then use native .toLocaleDateString to make a nice format
				$("#eventDetailsDate").text((recordData.date) ? new Date(recordData.date).toLocaleDateString("en-US", dateLocaleOptions) : "");

				// If the event ends on the same day it starts, then show mm/dd/yy hh:ss to hh:ss rather than mm/dd/yy hh:ss to mm/dd/yy hh:ss.
				if (new Date(recordData.date).toLocaleDateString("en-US", {timeZone: "Pacific/Honolulu"}) === new Date(recordData.endDate).toLocaleDateString("en-US", {timeZone: "Pacific/Honolulu"})) {
					$("#eventDetailsEndDate").text((recordData.endDate) ? " to " + new Date(recordData.endDate).toLocaleTimeString("en-US", dateLocaleOptions) : "");
				} else {
					// Event ends on a different day, so make it clear that it ends on a different date.
					$("#eventDetailsEndDate").text((recordData.endDate) ? " to " + new Date(recordData.endDate).toLocaleDateString("en-US", dateLocaleOptions) : "");
				}

				$(".eventDetails").fadeIn(300); // A little slower than the scrolling duration of the Event List
			});
		});
	}
}
