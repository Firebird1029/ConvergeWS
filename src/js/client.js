"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

// Bulma Navbar Burger
document.addEventListener("DOMContentLoaded",function(){var t=Array.prototype.slice.call(
document.querySelectorAll(".navbar-burger"),0);t.length>0&&t.forEach(function(t){t.addEventListener("click",function(){
var e=t.dataset.target,n=document.getElementById(e);t.classList.toggle("is-active"),n.classList.toggle("is-active")})})});

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

// Go to Welcome Section on Home Page When Nav Button is Clicked
function jumpToWelcome () {
	if ($("#welcome").length) {
		// If on home page, scroll to Welcome section
		$('html, body').animate({
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
	console.log(galleryElement)
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
