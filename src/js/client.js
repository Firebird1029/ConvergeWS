"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

// Navbar Burger
document.addEventListener("DOMContentLoaded",function(){var t=Array.prototype.slice.call(
document.querySelectorAll(".navbar-burger"),0);t.length>0&&t.forEach(function(t){t.addEventListener("click",function(){
var e=t.dataset.target,n=document.getElementById(e);t.classList.toggle("is-active"),n.classList.toggle("is-active")})})});

// Home Page Map
function initMap () {
	var clchCoordinates = {lat: 21.322523, lng: -157.859298};
	var map = new google.maps.Map($("#map")[0], {
		zoom: 16,
		center: clchCoordinates
	});

	var marker = new google.maps.Marker({
		position: clchCoordinates,
		map: map,
		title: "CLCH"
	});
}

// Add Background Behind Navbar
$(document).on("scroll", function () {
	if($(this).scrollTop() >= $(".hero-foot").position().top) {
		$(".navbar").addClass("navbarBackground");
	} else {
		$(".navbar").removeClass("navbarBackground");
	}
})

// Socket.io
var socket = io.connect();

// socket.emit("refreshRequest", {base: "About Sections", table: "Front Page"});
// socket.on("refreshResponse", function processRefreshResponse (data) {
// 	console.log(data);
// 	Object.keys(data).forEach((key) => {
// 		$("#dynamicWrapper").append(data[key].front);
// 	});
// });