/* Common */
new Route("/", {
		target : null,
		frame : "./views/frame_main.html",
		contents : "helloWorld!"
	},
	{
		routeControllers : {
			onRnderEnd :[
				function() {
					console.log("Route Accessed.");
				}
			]
		}
		destinationControllers : {
			onRnderEnd :[
				function() {
					console.log("Hello World!");
				}
			]
		}
	}
);