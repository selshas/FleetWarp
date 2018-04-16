/*

	This file containes Router Static Class and its supporting classes.
	Note that, this file does not containing actual application code.
	to declare routes on your app, Please open 'routes.js'.

*/

// Somehow Node.include was not defined. i.e you may not include 'General.js' on your project.
if (typeof Node.prototype.include == "undefined") {
	Node.prototype.include = function(url, callback) {
		if (url[0] == ".") {
			url = baseDir+url.substring(1, url.length);
		}
		var self = this;
		Ajax.request({
			url : url,
			method : "GET",
			dataType : "text"
		}, null, function(source) {
			self.innerHTML = changeSubTempleteExpressionToComment(source);
			if (typeof callback == "function") {
				callback();
			}
		});
	}
}

//Element.empty()
if (typeof Node.prototype.empty == "undefined") {
	Node.prototype.empty = function() {
		this.innerHTML = "";
	}
}

//global variable contains document.body
var Body = null;

//Route
/*
	: Route Class represents A Route of application. The Instance of Route Class contains URI information and Layouts and Controllers.

	__constructor(Array<Layout> layouts)
	__constructor(Array<Layout> layouts, MIX(function, string) destinationController)
	__constructor(Array<Layout> layouts, Array<MIX(function, string)> destinationController)
	__constructor(Array<Layout> layouts, Object controllers = {
		MIX(Object, MIX(function, string), Array<MIX(function, string)>) routeControllers
	})
	__constructor(Array<Layout> layouts, Object controllers = {
		MIX(Object, MIX(function, string), Array<MIX(function, string)>) destinationControllers
	})
	__constructor(Array<Layout> layouts, Object controllers = {
		MIX(Object(Controllers), MIX(function, string), Array<MIX(function, string)>) routeControllers,
		MIX(Object(Controllers), MIX(function, string), Array<MIX(function, string)>) destinationControllers
	})
		: Route.constructor() checks validity of parameter and stores.

	string path
		: URI information of The Route
	Array<Layout> layouts
		: Array of Layout Intances.
	Controllers routeControllers
		: Intance of Controllers Class, that is containing routeControllers
	Controllers destinationControllers
		: Intance of Controllers Class, that is containing destinationControllers

*/
var Route = function() {

	var path		= null;
	var layouts		= null;
	var controllers = null;
	
	var routeControllers		= null;
	var destinationControllers	= null;

	//json argument passing
	if (arguments[0] != null && isObject(arguments[0])) {
		if (arguments.length > 1) {
			var error = new RangeError("When passing JSON as argument of Route::constructor(), there must be passed only one argument.");
			errorThrow(error);
			return false;
		}
		
		var arguments = arguments[0];	//raplace arguments to parameter object

		path		= arguments.path		?arguments.path		  :null;
		layouts		= arguments.layouts		?arguments.layouts	  :null;
		controllers = arguments.controllers ?arguments.controllers:null;
	}
	//standard argument passing
	else {
		path		= arguments[0]?arguments[0]:null;
		layouts		= arguments[1]?arguments[1]:null;
		controllers = arguments[2]?arguments[2]:null;
	}

	//check if required parameters is properly passed
	//check if argument 'path' is undefined.
	if (!path) {
		var error = new ReferenceError("'path', The first argument of Route.constructor() is required.");
		errorThrow(error);
		return false;
	}
	//check if argument 'layouts' is undefined.
	if (!layouts) {
		var error = new ReferenceError("'layouts', The second argument of Route.constructor() is required.");
		errorThrow(error);
		return false;
	}

	//check parameter types
	if (typeof path != "string") {
		var error = new TypeError("'path', The first argument of Route.constructor() must be a string.\ncurrent type is : "+typeof path);
		errorThrow(error);
		return false;
	}
	if (!isObject(layouts) && !isArray(layouts)) {
		var error = new TypeError("'layout', The second argument of Route.constructor() must be an Object or Array of Object.\ncurrent type is : "+typeof layouts);
		errorThrow(error);
		return false;
	}
	if (controllers && !(isObject(controllers) || isArray(controllers) || (typeof controllers == "function") || (typeof controllers == "string"))) {
		var error = new TypeError("'controllers', The third argument of Route.constructor() must be an Object or Array of Object.\ncurrent type is : "+typeof controllers);
		errorThrow(error);
		return false;
	}

	//check if the route path is already exist.
	if (typeof Router.routes[path] != "undefined") {
		var error = new URIError("the route '"+path+"' is already exist.");
		errorThrow(error);
		return false;
	}

	if (layouts && !isArray(layouts)) {
		layouts = new Array(layouts);
	}
	layouts.forEach(function(item, index) {
		layouts[index] = new Layout(item)
	});
	
	//convert single function or script path parameter to single array parameter. 
	if (typeof controllers == "function" || typeof controllers == "string") {
		controllers = new Array(controllers);
	}

	//convert single array parameter to complete controllers object form. the parameter would set to onRenderEnds
	if (isArray(controllers)) {
		controllers = {
			destinationControllers : {
				onRenderEnd : controllers
			}
		}
	}

	if (controllers && controllers) {
		//unify to Array
		var aliases_routeControllers = new Array(
			"routeControllers",
			"routeCtrlers"
		);
		var aliases_destinationControllers = new Array(
			"destinationControllers",
			"destCtrlers"
		);
		mergeControllerAliases(controllers, aliases_routeControllers);
		mergeControllerAliases(controllers, aliases_destinationControllers);
		
		//Instantiate Controllers
		routeControllers = new Controllers(controllers.routeControllers);
		destinationControllers = new Controllers(controllers.destinationControllers);
	}


	this.path					= path;
	this.layouts				= layouts;
	this.routeControllers		= typeof routeControllers != "undefined"?routeControllers:null;
	this.destinationControllers = typeof destinationControllers != "undefined"?destinationControllers:null;

	Router.routes[path] = this;
} //end of Route.

//Layout
/*
	: Layout Class represents View Information about how to assemble html files to single document.

	MIX(string, null) target
		: ID string of Target Element
	string frame
		: path of a HTML file, which is defines macroscopic structure of document. 
	Object { elementID => MIX(string, Object(Layout)) } contents
		: contents member variable contains view datas, pairs of element's ID and path of specific HTML file. ID string is the keys, and path to the file is value. and the value could be an object
*/
var Layout = function() {

	var target;
	var frame = null;
	var contents = null;

	if (arguments.length == 1 && isObject(arguments[0])) {
		//the argument is object
		target	 = arguments[0].target	?arguments[0].target	:null;
		frame	 = arguments[0].frame	?arguments[0].frame		:null;
		contents = arguments[0].contents?arguments[0].contents	:null;
	}
	else if (arguments.length > 1) {
		target	 = arguments[0]?arguments[0]:null;
		frame	 = arguments[1]?arguments[1]:null;
		contents = arguments[2]?arguments[2]:null;
	}

	//check if required argument passed. 
	if (typeof target == "undefined") {
		var error = new TypeError("The first argument 'target' is required");
		errorThrow(error);
		return false;
	}
	if (typeof frame == "undefined") {
		var error = new TypeError("The second argument 'frame' is required");
		errorThrow(error);
		return false;
	}
	if (typeof contents == "undefined") {
		var error = new TypeError("The third argument 'contents' is required");
		errorThrow(error);
		return false;
	}

	if (!(typeof target == "string" || target == null)) {
		var error = new TypeError("The first argument 'target' of Layout.constructor() must be a string or null.");
		errorThrow(error);
		return false;
	}	
	if (typeof frame != "string") {
		var error = new TypeError("The second argument 'frame' of Layout.constructor() must be a string or null.");
		errorThrow(error);
		return false;
	}
	if (contents && !isObject(contents)) {
		var error = new TypeError("The third argument 'contents' of Layout.constructor() must be an Object or null.");
		errorThrow(error);
		return false;
	}

	this.target = target;
	this.frame = frame;
	this.contents = contents;
}

//View
/*
	: View Class represents a single unit of page assembling. it pares target element and specific view file which is containing HTML. 

	MIX(Element, string) target
		: Target Element or its ID.
	string viewPath
		: path to specific view file, containing HTMLs.
*/
var View = function(target, viewPath) {
	if (!(target instanceof Element) && typeof target != "string") {
		var error = new TypeError("The first argument 'target' of View.constructor() must be an Element or a string.");
		errorThrow(error);
		return false;
	}
	if (typeof viewPath != "string") {
		var error = new TypeError("The second argument 'viewPath' of View.constructor() must be a string.");
		errorThrow(error);
		return false;
	}
	this.target = target;
	this.viewPath = viewPath;
}


//Router
/*
	: Router Static Class actually connects client's request to Routes. This Process is called Routing.

	Array<Route> routes
		: containing Route Instances.
	Route route_destination
		: contains Destination Route.
	string requestedPath
		: The Path, client requested.
	Object queryParameters
		: Query Parameters passed rear of requested URI.
	Object routeParameters
		: Route Parameters passed through middle of requested URI.
	Object* queryParams
		: shortcut alias of queryParameters
	Object* routeParams
		: shortcut alias of routeParameters 

	Route declareRoute(Array<Layout> layouts)
	Route declareRoute(Array<Layout> layouts, MIX(function, string) destinationController)
	Route declareRoute(Array<Layout> layouts, Array<MIX(function, string)> destinationController)
	Route declareRoute(Array<Layout> layouts, Object controllers = {
		MIX(Object, MIX(function, string), Array<MIX(function, string)>) routeControllers
	})
	Route declareRoute(Array<Layout> layouts, Object controllers = {
		MIX(Object, MIX(function, string), Array<MIX(function, string)>) destinationControllers
	})
	Route declareRoute(Array<Layout> layouts, Object controllers = {
		MIX(Object(Controllers), MIX(function, string), Array<MIX(function, string)>) routeControllers,
		MIX(Object(Controllers), MIX(function, string), Array<MIX(function, string)>) destinationControllers
	})
		: instantiates Route, and return it. 

	string getRequestedPath()
		: remove base directory from loaction.pathname, return App URI.
	Route routeIdentify(string requestedPath)
		: find requested Route from Router.routes, return it.
	Array<string> getRouteHierarchy()
		: Analyse route path, get a stack of route paths in hierarchy.
	bool reRoute(string path)
		: stop all Rendering Process re-request designated Route.
	Object getQueryParameters()
		: get an Object contains parameters passed through query string. 
	Object getRouteParameters()
		: get an Object contains parameters passed through route path.
	void pageRender(Event e)
		: Entrance to Rendering Process. This method executes Renderer after identifying requested route and initializing of renderer. 
	void pageLoad()
		: Callback function, executes when page is loaded, which continues to Router.pageRender().
	void hyperLinkRouting(Event e)
		: Callback function, replaces normal click events of Anchor Tags. It executes Router.reRoute() method for internal routes instead of page movements.
*/
var Router = {
	routes : new Array(),

	route_destination : null,

	requestedPath : null,

	queryParameters : {},
	routeParameters : {},
	
	queryParams : null, //alias of queryParameters
	routeParams : null, //alias of routeParameters

	//Append new route
	declareRoute : function(/* string path, string layout, array·functions·string controllers, array·function·string callback */) {
		var path = null;
		var layouts = null;
		var controllers = null;

		//in case of JSON argument passing
		if (isObject(typeof arguments[0])) {
			try {
				return new Route(arguments[0]);
			}
			catch(error) {
				console.error(error);
			}
		}
		//in case of standard route declaration
		else {
			path = arguments[0];
			layouts = typeof arguments[1] == "undefined"?null:arguments[1];
			controllers = typeof arguments[2] == "undefined"?null:arguments[2];
			try {
				return new Route(path, layouts, controllers);
			}
			catch(error) {
				displayError(error);
			}
		}
		return null;
	},

	getRequestedPath : function() {
		var requestedPath = baseDir?location.pathname.replace(baseDir, ""):location.pathname;
		if (requestedPath[0] != "/") {
			requestedPath = "/"+requestedPath;
		}
		this.requestedPath = requestedPath;

		return requestedPath?requestedPath:"/";	
	},

	//identify route from requested path
	routeIdentify : function(requestedPath) {
		if (typeof this.routes[requestedPath] != "undefined") {
			return this.routes[requestedPath];
		}
		else {
			for (var pathExpression in this.routes) {
				var route = this.routes[pathExpression];

				var regexp_parameterExpression = /\{([^\/]+)\}/g;
				var regexp_pathExpression = new RegExp("^"+pathExpression.replace(regexp_parameterExpression, "([^\/]+)").replace(/\//g, "\\/")+"$");

				var matchData_paramValues;				
				if (matchData_paramValues = regexp_pathExpression.exec(requestedPath)) {
					return route;
				}
			}
		}
		return null;
	},
		
	//get an array contains hierarchical routes
	getRouteHierarchy : function(requestedPath) {
		if (typeof requestedPath != "string") {
			var error = new TypeError("The argument of Router::GetRouteHierarchy() must be a string.\ncurrent type is : "+typeof requestedPath);
			errorThrow(error);
			return null;
		}
		var stack_routeHierarchy = new Array();
		if (requestedPath != "/") {
			var parentRoute = requestedPath;
			do{
				stack_routeHierarchy.push(parentRoute);
			}
			while (parentRoute = parentRoute.replace(new RegExp("\/[^\/]*$"), ""));
		}
		stack_routeHierarchy.push("/");
		
		return stack_routeHierarchy;
	},

	reRoute : function(routePath) {
		//enqueue next route.
		if (typeof routePath != "string") {
			throw new TypeError("The argument of Router.reRoute() required as string.");
			return false;
		}
		history.pushState(routePath, "", baseDir + routePath);
		Event.state = routePath;

		if (PageRenderer.isRenderEnd) {
			Router.pageRender(Event);
			return true;
		}
		PageRenderer.isReRouteFired = true;
		PageRenderer.queue_reRoutes.push(routePath);
		return true;
	},

	getQueryParameters : function() {	
		//get query parameters
		Router.queryParameters = location.search.substr(1).split("&");
		for (var i in Router.queryParameters) {
			var temp = Router.queryParameters[i].split("=",2);
			var key = temp[0];
			var value = temp[1];
			delete Router.queryParameters[i];

			Router.queryParameters[key] = value;
		}
		return Router.queryParameters;
	},
	getRouteParameters : function() {
		var designatedRoute = Router.route_destination.path;

		var regexp_parameterExpression = /\{([^\/]+)\}/g;
		var regexp_pathExpression = new RegExp("^"+designatedRoute.replace(regexp_parameterExpression, "([^\/]+)").replace(/\//g, "\\/")+"$");

		var matchData_paramValues;
		if (matchData_paramValues = regexp_pathExpression.exec(this.requestedPath)) {
			var routeParams = Router.routeParameters;
			var matchData_paramKeys;
			var i = 0;
			matchData_paramValues.shift(); //make matched data to queue.
			while(matchData_paramKeys = regexp_parameterExpression.exec(designatedRoute)) {
				var key = matchData_paramKeys[1];
				routeParams[key] = matchData_paramValues[i];
				i++;
			}
			return routeParams;
		}
		return false;
	},

	//render the page
	pageRender : function(e) {
		var requestedPath = Router.getRequestedPath();

		//check if requestedPath is exist on Router.
		if (Router.route_destination = Router.routeIdentify(requestedPath)) {
			console.log("requestedPath : " + requestedPath);
		}
		else {
			throw new URIError("RequestedPath does not Exist");
			return false;
		}

		Router.getRouteParameters();
		Router.getQueryParameters();

		PageRenderer.stack_routeHierarchy = Router.getRouteHierarchy(requestedPath);

		PageRenderer.initialize();	//initialize renderer
		PageRenderer.render();		//start render
	},

	pageLoad : function() {
		Body = document.body;

		Router.queryParams = Router.queryParameters;
		Router.routeParams = Router.routeParameters;

		Router.pageRender();
	},
	
	hyperLinkRouting : function(e) {
		var href = this.getAttribute("href");
		var target = this.getAttribute("target")?this.getAttribute("target"):null;

		if (href[0] == ".") {
			if (href[1] == "/") {
				if (!target) {
					e.preventDefault();
					Router.reRoute(location.pathname + this.pathname);
				}
			}
			else if (href[1] == ".") {
				e.preventDefault();
				//move to upper hierarchy
				Router.reRoute(location.pathname.substr(0,location.pathname.lastIndexOf("/"))+this.pathname);
			}
		}
		else if (this.hostname == location.hostname) {
			if (!target) {
				e.preventDefault();
				Router.reRoute(this.pathname+this.search);
			}
		}
	}//end of hyperLinkRouting
}

//PageRenderer
/*
	: PageRenderer Static Class controlls Rendering process.

	Array<function> queue_renderSteps
		: the member variable contains functions classified as renderSteps. Empty of this queue means that, asynchronous request has been occured or Rendering has been ended. 

	Array<string> queue_reRoutes
		: if Router.reRoute() method has been excecuted before page rendering is done, remember the requested route path in this variable instead immediate reRouting. 
	Array<string> stack_routeHierarchy
		: contains route paths tracing on requested hierarchy as stack.

	Array<View> queue_views
		: queue, containing Instances of View Class.

	Array<Controller> queue_destinationControllers_onRenderStart
		: quque, containing destination controllers designated on onRenderStart
	Array<Controller> queue_routeControllers_onRenderStart
		: quque, containing route controllers designated on onRenderStart
	Array<Controller> queue_routeControllers_onRenderEnd
		: quque, containing route controllers designated on onRenderEnd
	Array<Controller> queue_destinationControllers_onRenderEnd
		: quque, containing destination controllers designated on onRenderEnd
	
	bool isReRouteFired
		: represents state of Router. if it is true, Renderer will skip remaining renderingSteps, continue to new requested path.
	bool isRenderEnd
		: contains state of renderer. if it is false, renderer is doing nothing. In another case, renderer is rendering document.

	void initialize()
		: reset all queues and prepare Renderer to render.
	void convertAndEnqueueViewsFromLayouts(Layout layouts)
		: convert A Layout to instances of View. and enqueue the instances to queue_views.
	void emptyNonInvolvedElements()
		: clear all innerHTMLs from non-involved Elements
	void renderView(View view)
		: render A View.
	void render()
		: start Rendering Process
	void loopRenderingSteps()
		: dequeue a function from queue_renderStepts and execute it. until the queue is empty.

	void renderingStep_initialize()
		: enqueue destination controllers to prepare execution.
	void renderingStep_executeDestCtrler_onRenderStarts()
		: dequeue onRenderStart Destination Controllers one by one and execute.
	void renderingStep_executeRouteCtrler_onRenderStarts()
		: dequeue onRenderStart Route Controllers one by one and execute.
	void renderingStep_renderView()
		: dequeue a View Instance from queue_views, render it. if queue_views is empty, lead process to renderingStep_nextHierarchy().
	void renderingStep_nextHierarchy()
		: if current route is not destination, pop a route path from stack_routeHierarchy, get its view datas and controllers, enqueue it.
	void renderingStep_executeRouteCtrler_onRenderEnd()
		: after rendering all views of current route, executes its onRenderEnd Route Controllers one by one.
	void renderingStep_overrideHyperLinks()
		: if there is no remained routes on hierarchy and views on queue_views, override all click events of anchors which has href attributes. 
	void renderingStep_executeDestCtrler_onRenderEnd()
		: after rendering all routes, execute onRenderEnd Destination Controllers one by one.
	void renderingStep_reRouting()
		: if Router.reRoute() is fired while rendering, 
	void renderStep_endingRender()
		: reset switches and and detach all external destination controllers from document.

*/
var PageRenderer = {
	queue_renderSteps : new Array(),

	queue_reRoutes : new Array(),
	stack_routeHierarchy : new Array(),

	queue_views : new Array(),
	queue_destinationControllers_onRenderStart : new Array(),
	queue_routeControllers_onRenderStart : new Array(),
	queue_routeControllers_onRenderEnd : new Array(),
	queue_destinationControllers_onRenderEnd : new Array(),
	
	isReRouteFired : false,
	isRenderEnd : false,

	initialize : function() {
		this.queue_renderSteps = new Array();

		this.queue_views = new Array();
		this.queue_destinationControllers_onRenderStart = new Array();
		this.queue_routeControllers_onRenderStart = new Array();
		this.queue_routeControllers_onRenderEnd = new Array();
		this.queue_destinationControllers_onRenderEnd = new Array();

		Loader_exRouteCtrler.initialize();
		this.isReRouteFired = false;
		this.isRenderEnd = false;
	},

	convertAndEnqueueViewsFromLayouts : function(layouts) {		
		//layouts is not null
		for (var i in layouts) {
			//visit each items in layout array
			var rootLayout = layouts[i];

			var queue_bfs = new Array();
			queue_bfs.push(rootLayout);
			while (queue_bfs.length) {
				var layout = queue_bfs.shift();

				if ((typeof layout.target == "undefined") || !layout.target) {
					//target Property is not exist.
					layout.target = document.body; //set default as body.
				}

				//create view Instance
				var view = new View(layout.target, layout.frame);
				PageRenderer.queue_views.push(view);

				//fetch content object
				if (layout.contents) {
					if (isObject(layout.contents)) {
						//content is child layout
						for (var targetID in layout.contents) {
							var subLayout = layout.contents[targetID];
							if (typeof subLayout == "string") {
								//specific file path
								subLayout = new Layout(targetID, layout.contents[targetID], null);
							}
							else {
								subLayout.target = targetID;
							}
							queue_bfs.push(subLayout);
						}
					}
					else {
						throw TypeError("contents property of layout object must be an object or a string or null.\ntypeof current value is: "+typeof layout.contents);
					}
				}
			}
		}//for (var i in route.layouts)
	},

	emptyNonInvolvedElements : function() {
		//remove route and view attributes from other path hierarchy
		document.querySelectorAll("*[data-route]").forEach(function(self) {
			var regexp_isRequestChildRoute = new RegExp("^"+(self.dataset.route=="/"?"":self.dataset.route+"/")+".+");
			if (!regexp_isRequestChildRoute.test(Router.requestedPath)) {
				self.empty();
				delete self.dataset.route;
				delete self.dataset.view;
			}
		});
		PageRenderer.isPageGCed = true;	
	},

	renderView : function(view) {	
		if (!(view.target instanceof Element)) {
			if (typeof view.target == "string") {
				var elementID = view.target;
				view.target = document.getElementById(elementID);
				if (!view.target) {
					console.error("'" + elementID + "' doesn't exist.");
					return false;
				}
			}
			else {
				console.error("view.target must be an instance of Element or a string.");
				return false;
			}
		}

		if (view.target.dataset.route && (view.target.dataset.view == view.viewPath)) {
			//skip to include
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_renderView);
		}
		else {
			//assemble view component
			view.target.include(view.viewPath, function() {		
				PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_renderView);
				PageRenderer.loopRenderingSteps();
			});
			view.target.dataset.route = route.path;
			view.target.dataset.view = view.viewPath;
		}
	},

	render : function() {
		PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_initialize);
		PageRenderer.loopRenderingSteps();
	},
	loopRenderingSteps : function() {
		while (PageRenderer.queue_renderSteps.length) {
			var renderingStep = PageRenderer.queue_renderSteps.shift();
			renderingStep();
		}
	},

	//rendering Steps
	renderingStep_initialize : function() {
		//check if destination controllers exist
		if (Router.route_destination.destinationControllers) {
			//enqueue destinationControllers.onRenderStart
			isArray(Router.route_destination.destinationControllers.onRenderStart) && Router.route_destination.destinationControllers.onRenderStart.forEach(function(controller) {
				PageRenderer.queue_destinationControllers_onRenderStart.push(new Controller(Router.route_destination.path, controller, true));			
			});
			//enqueue destinationControllers.onRenderEnd
			isArray(Router.route_destination.destinationControllers.onRenderEnd) && Router.route_destination.destinationControllers.onRenderEnd.forEach(function(controller) {
				PageRenderer.queue_destinationControllers_onRenderEnd.push(new Controller(Router.route_destination.path, controller, true));			
			});
		}
		PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeDestCtrler_onRenderStarts);
	},
	renderingStep_executeDestCtrler_onRenderStarts : function() {
		//execute destinationController.onRenderStart
		if (PageRenderer.isReRouteFired) {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_reRouting);
		}
		else if (PageRenderer.queue_destinationControllers_onRenderStart.length) {
			PageRenderer.queue_destinationControllers_onRenderStart.shift().execute(function() {
				PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeDestCtrler_onRenderStarts);
				PageRenderer.loopRenderingSteps();
			});
		}
		else {
			PageRenderer.emptyNonInvolvedElements();
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeRouteCtrler_onRenderStarts);
		}
	},
	renderingStep_executeRouteCtrler_onRenderStarts : function() {
		//execute routeControllers.onRenderStart
		if (PageRenderer.isReRouteFired) {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_reRouting);
		}
		else if (PageRenderer.queue_routeControllers_onRenderStart.length) {
			PageRenderer.queue_routeControllers_onRenderStart.shift().execute(function() {
				PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeRouteCtrler_onRenderStarts);
				PageRenderer.loopRenderingSteps();
			});
		}
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_renderView);		
		}
	},
	renderingStep_renderView : function() {
		//render a view.
		if (PageRenderer.queue_views.length) {
			var view = PageRenderer.queue_views.shift();
			PageRenderer.renderView(view);
		}
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_nextHierarchy);			
		}
	},
	renderingStep_nextHierarchy : function() {
		//get next hierarchy when queue_views is empty
		if (PageRenderer.stack_routeHierarchy.length) {
			//there is remaining hierarchies
			var nextRoute = Router.routeIdentify(PageRenderer.stack_routeHierarchy.pop());

			//if the route has layout
			if (nextRoute.layouts) {
				//convert layouts to view instance, enqueue it into queue_views
				PageRenderer.convertAndEnqueueViewsFromLayouts(nextRoute.layouts);
			}
			route = nextRoute;

			//enqueue routeControllers
			var routeControllers = null;
			if (typeof route.routeControllers != "undefined" && (routeControllers = route.routeControllers)) {
				//enqueue onRenderStarts
				if (routeControllers.onRenderStart) {
					routeControllers.onRenderStart.forEach(function(controller) {
						PageRenderer.queue_routeControllers_onRenderStart.push(new Controller(route.path, controller, false));									
					});
				}
				//enqueue onRenderEnds
				if (routeControllers.onRenderEnd) {
					routeControllers.onRenderEnd.forEach(function(controller) {
						PageRenderer.queue_routeControllers_onRenderEnd.push(new Controller(route.path, controller, false));								
					});
				}
			}
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_renderView);
		} //if (stack_routeHierarchy.length)
		//no more hierarchy remained. end of view assembling.
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeRouteCtrler_onRenderEnd);
		}
	},
	renderingStep_executeRouteCtrler_onRenderEnd : function() {
		if (PageRenderer.isReRouteFired) {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_reRouting);
		}
		else if (PageRenderer.queue_routeControllers_onRenderEnd.length) {
			//execute routeController.onRenderEnd
			PageRenderer.queue_routeControllers_onRenderEnd.shift().execute(function() {
				PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeRouteCtrler_onRenderEnd);
				PageRenderer.loopRenderingSteps();
			});
		}
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_overrideHyperLinks);
		}
	},
	renderingStep_overrideHyperLinks : function() {
		//override anchor connection with internal links
		var array_anchors = document.querySelectorAll("a[href]");
		if (array_anchors.length) {
			array_anchors.forEach(function(anchor) {
				anchor.removeEventListener("click", Router.hyperLinkRouting);
				anchor.addEventListener("click", Router.hyperLinkRouting);
			});
		}
		PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeDestCtrler_onRenderEnd);
	},
	renderingStep_executeDestCtrler_onRenderEnd : function() {
		if (PageRenderer.isReRouteFired) {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_reRouting);
		}
		else if (PageRenderer.queue_destinationControllers_onRenderEnd.length) {
			//execute destinationController.onRenderEnd
			PageRenderer.queue_destinationControllers_onRenderEnd.shift().execute(function() {
				PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_executeDestCtrler_onRenderEnd);
				PageRenderer.loopRenderingSteps();
			});
		}
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderingStep_reRouting);
		}
	},
	renderingStep_reRouting : function() {
		if (PageRenderer.queue_reRoutes.length) {
			var path_nextRoute = PageRenderer.queue_reRoutes.shift();
			Router.pageRender();
		}
		else {
			PageRenderer.queue_renderSteps.push(PageRenderer.renderStep_endingRender);		
		}
	},
	renderStep_endingRender : function() {
		PageRenderer.isRenderEnd = true;
		PageRenderer.isReRouteFired = false;

		Loader_exDestCtrler.clear();
	}
	//renderingSteps end
}

//Controller
/*
	: Controller Class represent a controller registered at specific Route. 

	__constructor(string path_route, function controller, bool isDestination)
		: check validity of arguments, store values.
	
	string route
		: path of the Route, the controller signed.
	function controller
		: actual body code of controller.
	bool isDestination
		: store if the controller is signed as destination controller

	bool execute(stepLoopEntry)
		: execute controller and call stepLoopEntry().

*/
var Controller = function(path_route, controller, isDestination) {
	if (typeof path_route != "string") {
		var error = new TypeError("typeof argument 'path_route' of Controller.constructor() must be a string.\ncurrent type is : " + typeof path_route);
		throw error;
		return false;
	}
	if (typeof controller != "function" && typeof controller != "string") {
		var error = new TypeError("typeof argument 'controller' of Controller.constructor() must be a function or string.\ncurrent type is : " + typeof controller);
		throw error;
		return false;
	}

	this.route = path_route;
	this.controller = controller;
	this.isDestination = isDestination?true:false;

	this.execute = function(stepLoopEntry) {
		if (typeof this.controller == "function") {
			//controller is function
			var controllerReturn = this.controller(stepLoopEntry);
			if (typeof controllerReturn == "undefined" || controllerReturn != false) {
				stepLoopEntry();
			}
			return true;
		}
		else if (typeof this.controller == "string") {
			//controller is external script file
			var loader = this.isDestination?Loader_exDestCtrler:Loader_exRouteCtrler;
			loader.callback_onload = stepLoopEntry;
			loader.load(this.route, this.controller);
			return true;
		}
		else {
			console.error("Controller.controller must be a function or a string.");
			return false;
		}
	}
}
//Controllers
/*
	: Controller Class represents group of instances of Controller Class.

	__constructor(MIX(string, function) onRenderEnd)
	__constructor(MIX(string, function) onRenderStart, MIX(string, function) onRenderEnd)
	__constructor(Object parameters = { 
		MIX(string, function) onRenderStart, 
		MIX(string, function) onRenderEnd 
	})
		: recieve controller bodies or external path via argument or parameter object.

	Array<MIX(string, function)> onRenderStart
		: Array of controller functions and external script paths that will be executes before The Layout is Rendered.
	Array<MIX(string, function)> onRenderEnd
		: Array of controller functions and external script paths that will be executes after The Layout has been Rendered.

*/
var Controllers = function(){
	var onRenderStart = null;
	var onRenderEnd	  = null;

	switch (arguments.length) {
		case 0 : break;
		case 1: {
			if (arguments[0] && isObject(arguments[0])) {
				//argument is JSON parameter passing
				arguments	  = arguments[0];

				onRenderStart = arguments.onRenderStart;
				onRenderEnd	  = arguments.onRenderEnd;
			}
			else {
				//arguments[0] is exist but not an object
				onRenderEnd	  = arguments[0];
			}
			break;
		}
		case 2: {
			//two arguments passed.
			onRenderStart	= arguments[0];
			onRenderEnd		= arguments[1];
			break;
		}
		default : {
			console.error("The Count of arguments of Controllers.constructor() must be in range 0-2.");
			return false;
		}
	}
	this.onRenderStart	= onRenderStart;
	this.onRenderEnd	= onRenderEnd;
}

var mergeControllerAliases = function(controllers, aliases_controllerGroups) {
	var changeValueToArray = function(paramName, value) {
		if (!isArray(value)) {
			if (typeof value != "string" && typeof value != "function") {
				console.error("'"+paramName+"' parameter must be an Object or Array of MIXED(string, function) or a string or function.\ncurrent type is : "+typeof controllers[varName]);				
			}
			return new Array(value);
		}
		return value;
	}

	var queue_merging = new Array();
	for(var i in aliases_controllerGroups) {
		//access to each alias members
		var varName = aliases_controllerGroups[i];
		if (controllers[varName] || (controllers[varName] = {})) {
			if (!isObject(controllers[varName])) {
				//value or list passed
				controllers[varName] = {
					onRenderStart : new Array(),
					onRenderEnd : changeValueToArray(varName, controllers[varName])
				}
			}
			else {
				//object passed
				if (typeof controllers[varName].onRenderStart == "undefined" || !controllers[varName].onRenderStart) {
					controllers[varName].onRenderStart = new Array();
				}
				else {
					controllers[varName].onRenderStart = changeValueToArray(varName, controllers[varName].onRenderStart);
				}
				if (typeof controllers[varName].onRenderEnd == "undefined" || !controllers[varName].onRenderEnd) {
					controllers[varName].onRenderEnd = new Array();
				}
				else {
					controllers[varName].onRenderEnd = changeValueToArray(varName, controllers[varName].onRenderEnd);
				}
			}
			if (i > 0){
				queue_merging.push(controllers[varName]);
				delete controllers[varName];
			}
		}
	}
	while (queue_merging.length) {
		var merge = queue_merging.shift();
		controllers[aliases_controllerGroups[0]].onRenderStart = controllers[aliases_controllerGroups[0]].onRenderStart.concat(merge.onRenderStart);
		controllers[aliases_controllerGroups[0]].onRenderEnd = controllers[aliases_controllerGroups[0]].onRenderEnd.concat(merge.onRenderEnd);
	}
}


//Loader_exRouteCtrler
/*
	: manage external route controllers.

	function callback_onload
		: the function, be executed after the script has been loaded. 
	Object loadedScripts
		: store instances of ExternalScript Class.
	Array<string> exScriptScope
		: store paths of external script files which the document should have to load at current Destination Route.

	void load(string route, string scriptPath)
		: create an instance of ExternalScript Class from scriptPath, store the instance at scriptPath key of loadedScript member Object. 
	void garbageCollect()
		: detach all unusing scripts from document. and also delete from loadedScripts object.
*/
var Loader_exRouteCtrler = {
	callback_onload : null,
	loadedScripts : {},
	exScriptScope : new Array(),

	initialize : function() {
		this.exScriptScope = new Array();
	},

	//load script to document
	load : function(route, scriptPath) {
		this.exScriptScope.push(scriptPath);
		if (typeof this.loadedScripts[scriptPath] == "undefined" || this.loadedScripts[scriptPath].route != route) {
			//if the script is not loaded or doesn't matched route
			if (typeof this.loadedScripts[scriptPath] != "undefined") {
				//the script is exist but does not have matching route. detach it to reload
				this.loadedScripts[scriptPath].detach();
				this.exScriptScope.splice(this.exScriptScope.indexOf(scriptPath), 1);
			}
			this.loadedScripts[scriptPath] = new ExternalScript(scriptPath, this.callback_onload);
			this.loadedScripts[scriptPath].attach();
			this.loadedScripts[scriptPath].route = route;
			this.loadedScripts[scriptPath].scriptTag.dataset.route = route;
		}
		else {
			this.callback_onload();
		}
	},
	//remove unusing scripts from document
	garbageCollect : function() {
		for (var key in this.loadedScripts) {
			var script = this.loadedScripts[key];
			if (this.exScriptScope.indexOf(key) == -1) {
				script.detach();
				delete this.loadedScripts[key];
			}
		}
	}
}

//Loader_exDestCtrler
/*
	: manage external destination controllers.

	function callback_onload
		: the function, be executed after the script has been loaded. 
	Object loadedScripts
		: store instances of ExternalScript Class.

	ExternalScript load()
		: create an instance of ExternalScript Class from scriptPath, store the instance at scriptPath key of loadedScript member Object. 
	void clear()
		: remove all loaded script tags from the document.
*/
var Loader_exDestCtrler = {
	callback_onload : null,
	loadedScripts : {},

	//load script to document
	load : function(route, scriptPath) {
		var externalScript = new ExternalScript(scriptPath, this.callback_onload);
		this.loadedScripts[scriptPath].route = route;
		this.loadedScripts[scriptPath] = externalScript;
		externalScript.attach();
		
		return externalScript;
	},
	clear : function() {
		for (var i in this.loadedScripts) {
			this.loadedScripts[i].detach();
		}
		this.loadedScripts = {};
	}
}


//ExternalScript
/*
	: ExternalScript Class represents a script file, dynamically loaded as controller body via code.

	__constructor(string path_scriptFile, function renderLoopEntry);
		: load a script file and execute. when the script is completely loaded, continues to renderLoopEntry for next renderingSteps.

	Element scriptTag
		: <script> Tag. The actual of script.
	string route
		: the route, script is 
	string path
		: path of script file.
	
	void attach()
		: attach scriptTag to document head. it automatically executes the script.
	void detach()
		: remove scriptTag from document head. it is meaningless but keep source code clean.
*/
var ExternalScript = function(path_scriptFile, renderLoopEntry) {
	
	this.scriptTag = document.createElement("script");
	this.route = null;

	if (typeof path_scriptFile != "string") {
		console.error("'path_scriptFile' is not string.\nCurrent type is : "+ typeof path_scriptFile);
		return false;
	}
	if (path_scriptFile[0] == ".") {
		this.path = baseDir + path_scriptFile.slice(1);
	}
	else {
		this.path = path_scriptFile;
	}
	this.scriptTag.src = this.path;

	this.attach = function() {
		document.getElementsByTagName("head")[0].appendChild(this.scriptTag);
	}
	this.detach = function() {
		console.log("Script Unloaded : " + this.scriptTag.src);
		this.scriptTag.parentNode.removeChild(this.scriptTag);
	}

	this.scriptTag.addEventListener("load", (function() {
		return function() {
			console.log("Script Loaded : " + path_scriptFile);
		}
	})());
	this.scriptTag.addEventListener("load", renderLoopEntry);
	this.attach();
}

//Event Apply
window.addEventListener("popstate", Router.pageRender);
window.addEventListener("load", Router.pageLoad);