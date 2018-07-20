"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

// Navbar Burger
document.addEventListener("DOMContentLoaded",function(){var t=Array.prototype.slice.call(
document.querySelectorAll(".navbar-burger"),0);t.length>0&&t.forEach(function(t){t.addEventListener("click",function(){
var e=t.dataset.target,n=document.getElementById(e);t.classList.toggle("is-active"),n.classList.toggle("is-active")})})});

// Home Page Map
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

// Add Background Behind Navbar (if on desktop and navbar is present)
// https://stackoverflow.com/questions/7182342/how-to-detect-when-the-user-has-scrolled-to-a-certain-area-on-the-page-using-jqu
$(window).on("load resize", function () {
	if ($(".navbar-burger").is(":hidden")) {
		// Desktop view
		if ($(".hero-body > .container > h1").length) {
			// If it contains just a regular heading at the top of the page, add the navbar background automatically.
		   $(".navbar").addClass("navbarBackground");
		} else {
			// If it contains a full height banner with no text heading, add the navbar background after scrolling past the banner.
			$(document).on("scroll", function () {
				if($(this).scrollTop() >= $(".hero-foot").position().top) {
					$(".navbar").addClass("navbarBackground");
				} else {
					$(".navbar").removeClass("navbarBackground");
				}
			});
		}
	}
});

// Collapsible Tiles
$(".collapsibleButton").each((index, collBtnEl) => {
	var boxID = $(collBtnEl).data("boxgroup");
	$(collBtnEl).click(() => {
		$(".collapsibleHeading[data-boxgroup=" + boxID + "]").toggleClass("has-text-grey");
		$(".collapsibleContent[data-boxgroup=" + boxID + "]").each((index, collContEl) => {
			if ($(collContEl).css("maxHeight") === "0px") {
				// Currently hidden/collapsed, will now show content
				$(collContEl).css("maxHeight", "" + $(collContEl).prop("scrollHeight") + "px");
				$(collContEl).css("padding", "0.75rem");
			} else {
				// Content currently being shown, will not hide/collapse
				$(collContEl).css("maxHeight", "0px");
				$(collContEl).css("padding", "0rem 0.75rem");
			}
		});
	});
});

// Photoswipe
// Init empty gallery array
var container = [];
// Loop over gallery items and push it to the array
$("#gallery").find("figure").each(function(){
	var $link = $(this).find("a.photoswipeElement"),
			item = {
				src: $link.attr("href"),
				w: $link.data("width"),
				h: $link.data("height"),
				title: $link.data("caption")
			};
	container.push(item);
});
// Define click event on gallery item
$("a.photoswipeElement").click(function(event){
	// Prevent location change
	event.preventDefault();
	// Define object and gallery options
	var $pswp = $(".pswp")[0],
			options = {
				index: $(this).parent("figure").index(),
				bgOpacity: 0.85,
				showHideOpacity: true
			};
	// Initialize PhotoSwipe
	var gallery = new PhotoSwipe($pswp, PhotoSwipeUI_Default, container, options);
	gallery.init();
});

// Socket.io
var socket = io.connect();

// socket.emit("refreshRequest", {base: "About Sections", table: "Front Page"});
// socket.on("refreshResponse", function processRefreshResponse (data) {
// 	console.log(data);
// 	Object.keys(data).forEach((key) => {
// 		$("#dynamicWrapper").append(data[key].front);
// 	});
// });