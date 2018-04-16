//global scope expand
/*
	arrayConstructor
		: contructor for Array only
	objectConstructor
		: contructor for Object only
	
	isObject()
		: whether the 'data' is an Object	
	isArray()
		: whether the 'data' is an Array

	void displayError(Error error)
		: display Error to console with exact line information.
	void getCallerLine()
		: get a line information of caller.
	void errorThrow(Error error)
		: throw an Error. if the caller is global scope, display the error to console with exact line information.
*/
var arrayConstructor = [].constructor;
var objectConstructor = {}.constructor;

function isObject(data) {
	try {
		if (data.constructor == objectConstructor) { 
			return true;
		}
		return false;
	}
	catch (error) {
		return false
	}
}
function isArray(data) {
	if (data && (data.constructor == arrayConstructor)) { 
		return true;
	}
	return false;
}

function displayError(error) {
	if (error.stack) {
		var stack = error.stack.split("\n");
		console.error(error.message,"\n",stack[3].trim());
	}
	else {
		var stack = (function() {try {throw new Error()} catch(error) {return error;}})().stack.split("\n");
		
		console.error(error.message,"\n",stack[5].trim());
	}
};
function getCallerLine() {
	var error = (function() {try {throw new Error()} catch(error) {return error;}})();
	var stack = error.stack.split("\n");
	return stack[4];	//0 = message, 1 = anonymous, 2 = current, 3 = caller, 4 = caller called
}
function errorThrow(error) {
	if (Route.caller) {
		//called in function
		throw error;
	}
	else {
		//called in global
		if (error.stack) {
			var stack = error.stack.split("\n");
			console.error(error.message,"\n",stack[stack.length-1].trim());
		}
		else {
			var stack = (function() {try {throw new Error()} catch(error) {return error;}})().stack.split("\n");
			
			console.error(error.message,"\n",stack[4].trim());
		}
	}
}


//Ajax
/*
	: Ajax Static Class performs AJAX request to designated URL.

	request(Object json_attributes = {
		string url, string method, string dataType
	}, Object json_parameters, function callbck)
		: performs AJAX request to designated URL.
*/
var Ajax = {
	request : function(json_attributes, json_parameters, callback) {
		var url = json_attributes.url;
		var method = json_attributes.method;
		var dataType = json_attributes.dataType;
		
		var queryString_parameters = "";
		if (json_parameters){
			var queryString_parameters = new Array();
			for(key in json_parameters) {
				if (typeof json_parameters[key] == "object") {
					json_parameters[key] = JSON.stringify(json_parameters[key]);
				}
				queryString_parameters.push(key+"="+json_parameters[key]);
			}
			queryString_parameters = queryString_parameters.join("&");

		}

		var xhr = new XMLHttpRequest();
		if (method == "get" || method == "GET" && queryString_parameters) {
			url += ("?" + queryString_parameters);
		}
		xhr.open(method, url, true);
		xhr.send(queryString_parameters);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				switch (xhr.status) {
					case 300 : {
						console.error("http responsed 300, ");
						break;
					} 
					default : {
						var response = xhr.responseText;
						var temp = response;
						try {
							if (dataType == "json" || dataType == "JSON") {
								response = response.trim();
								if (!(xhr.status == 204 && !response)) {
									response = JSON.parse(response);
								}
							}
						}
						catch(error) {
							console.log("Response Data is not JSON form. Response Data must be a formed string matched with dataType argument.");
							console.log(temp);
						}
						if (typeof callback != "undefined" && typeof callback == "function")	{
							callback(response, xhr.status);
						}
					}
				}
			}
		}
	}
}

//REST
/*
	:shortcut of Ajax Class for RESTful API requests.

	apiCall(string uri, string method, Object params, function callback)
		:send request to 'uri' as method, passing 'params' as parameter. execute 'callback' when the response is returned.
	
	get(string uri, object params)
	get(string uri, function callback)
	get(string uri, object params, function callback)
		:request GET to 'uri', passing 'params' as parameter. execute 'callback' when the response is returned.
	
	post(string uri, object params)
	post(string uri, function callback)
	post(string uri, object params, function callback)
		:request POST to 'uri', passing 'params' as parameter. execute 'callback' when the response is returned.
	
	put(string uri, object params)
	put(string uri, function callback)
	put(string uri, object params, function callback)
		:request PUT to 'uri', passing 'params' as parameter. execute 'callback' when the response is returned.
	
	delete(string uri, object params)
	delete(string uri, function callback)
	delete(string uri, object params, function callback)
		:request DELETE to 'uri', passing 'params' as parameter. execute 'callback' when the response is returned.
*/
var REST = {
	apiCall : function(uri, method, params, callback) {
		Ajax.request({
				url : uri,
				method : method,
				dataType : "JSON"
			},
			params,
			callback
		);	
	},

	//http methods
	get : function(uri, paramsOrCallback, callback) {
		var params = null;
		if (typeof paramsOrCallback == "function") {
			if (typeof callback != "undefined"){
				console.error("When second argument of REST.get() is function, third argument can not be set.");
				return false;
			}
			callback = paramsOrCallback;
		}
		else if (isObject(paramsOrCallback)) {
			params = paramsOrCallback;
			if (typeof callback == "undefined"){
				callback = null;
			}
		}

		this.apiCall(uri, "get", params, callback);
	},
	post : function(uri, paramsOrCallback, callback) {
		var params = null;
		if (typeof paramsOrCallback == "function") {
			if (typeof callback != "undefined"){
				console.error("When second argument of REST.post() is set, third argument can not be set.");
				return false;
			}
			callback = paramsOrCallback;
		}
		else if (isObject(paramsOrCallback)) {
			params = paramsOrCallback;
			if (typeof callback == "undefined"){
				callback = null;
			}
		}

		this.apiCall(uri, "post", params, callback);
	},
	put : function(uri, paramsOrCallback, callback) {
		var params = null;
		if (typeof paramsOrCallback == "function") {
			if (typeof callback != "undefined"){
				console.error("When second argument of REST.put() is set, third argument can not be set.");
				return false;
			}
			callback = paramsOrCallback;
		}
		else if (isObject(paramsOrCallback)) {
			params = paramsOrCallback;
			if (typeof callback == "undefined"){
				callback = null;
			}
		}

		this.apiCall(uri, "put", params, callback);
	},
	delete : function(uri, paramsOrCallback, callback) {
		var params = null;
		if (typeof paramsOrCallback == "function") {
			if (typeof callback != "undefined"){
				console.error("When second argument of REST.delete() is set, third argument can not be set.");
				return false;
			}
			callback = paramsOrCallback;
		}
		else if (isObject(paramsOrCallback)) {
			params = paramsOrCallback;
			if (typeof callback == "undefined"){
				callback = null;
			}
		}

		this.apiCall(uri, "delete", params, callback);
	}
}


function fetchObject(obj) {
	var r = "";
	for(k in obj) {
		var fd = null;
		if (isObject(obj[k])) {
			fd = fetchObject(obj[k]).replace(/\n/g, "	\n");
		}
		else {
			fd = obj[k];
		}
		r += k+" : " +fd+"\n";
	}
	return("{\n" + r + "}\n");	
}
function alertArray(obj) {
	alert(fetchObject(obj));
}
function getKeysFrom(obj) {
	var r = new Array();
	for (k in obj){
		r.push(k);
	}
	return r;
}

//Object Expand
/*
	Object.prototype.keys
		: get all enumerable keys from the object.
	Object.prototype.values
		: get all values of enumerable keys from the object.

	Object.prototype.clone()
		: copy the object. normally, setting object as a value does not copy(clone) object. It passes referece. clone() method is useful to make an copy of the object.
*/
Object.defineProperty(Object.prototype, "keys", {
		get : function() {
			var r = new Array();
			for (k in this){
				r.push(k);
			}
			return r;
		},
		enumerable : false
	}
);
Object.defineProperty(Object.prototype, "values", {
		get : function() {
			var r = new Array();
			for (k in this){
				r.push(this[k]);
			}
			return r;
		},
		enumerable : false
	}
);
Object.defineProperty(Object.prototype, "clone", {
	value : function() {
		var newObject = {};
		var key;
		for (key in this) {
			var value = this[key];
			if (isObject(value)) {
				value = value.clone();
			}
			newObject[key] = value;
		}
		return newObject;
	},
	enumerable : false
});



//Element Expand
/*

	void Element.prototype.include(url, callback)
		: send GET request to 'url', put it into The Element, as its contents. and execute 'callback' if it is signed.
	bool Element.prototype.attachTo(parentElement)
		: attach the element to parentElement's child. appending position is after of parentElement's last child node.
	bool Element.prototype.detach()
		: detach the element from its parent element.
	void Element.prototype.terminateChildNodes()
		: remove all childe Nodes from the Element, delete all of them.
	void Element.prototype.insertAfter(Node newNode, Node referenceNode)
		: insert 'newNode' in to the next of 'referenceNode'
	void Element.prototype.addClass(string className)
		: add 'className' to Element.className.
	void Element.prototype.removeClass(string className))
		: remove 'className' from Element.className.
	bool Element.prototype.hasClass(string className))
		: check if 'className' is exist in Element.className.


*/
Element.prototype.include = function(url, callback) {
	if (url[0] == ".") {
		url = path_root.substr(0, path_root.length-1)+url.substring(1, url.length);
	}
	var self = this;
	Ajax.request({
		url : url,
		method : "GET",
		dataType : "text"
	}, null, function(source) {
		//self.innerHTML = source;
		self.innerHTML = changeSubTempleteExpressionToComment(source);	
		if (typeof callback == "function") {
			callback();
		}
	});
}

Element.prototype.attachTo = function(parentElement) {
	if (parentElement instanceof Element) {
		parentElement.appendChild(this);
		return this;
	}
	console.error("The first argument of Element.attachTo() must be an Element.");
	return false;
};

Element.prototype.detach = function() {
	if (this.parentNode instanceof Element) {
		this.parentNode.removeChild(this);
		return this;
	}
	console.error("The Element does not have parentNode");
	return false;
};

Element.prototype.terminateChildNodes = function() {
	var stack = new Array();
	stack.push(this);
	while(stack.length) {
		var node = stack.pop();
		for (var i=0;i<nocde.childNodes.length;i++) {
			stack.push(node.childNodes[i]);
		}
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
		delete node;
	}
	delete stack;
};
Element.prototype.insertAfter = function(newNode, referenceNode) {
	if (referenceNode.parentNode != this) {
		console.log("referenceNode is not child of current Node.");
		return null;
	}
	if (referenceNode.nextSibling) {
		this.insertBefore(newNode, referenceNode.nextSibling);
		return newNode;
	}
	this.appendChild(newNode);
}

Element.prototype.addClass = function(newClassName) {
	if (this.className) {
		var classNames = this.className.split(" ");
		var i;
		for (i=0;i<classNames.length;i++) {
			var className = classNames[i].trim();
			if (newClassName == className) {
				return false;
			}
		}
		if (i < className.length) {
			classNames.push(newClassName);		
			this.className = classNames.join(" ");
			return true;
		}
		return false;
	}
	this.className = newClassName;
}

Element.prototype.removeClass = function(targetClassName) {
	var classNames = this.className.split(" ");
	for (i in classNames) {
		var className = classNames[i];
		if (targetClassName == className) {
			classNames.splice(i, 1);
		}
	}
	this.className = classNames.join(" ");
	return false;
}

Element.prototype.hasClass = function(targetClassName) {
	var classNames = this.className.split(" ");
	for (i in classNames) {
		var className = classNames[i].trim();
		if (targetClassName == className) {
			return true;
		}
	}
	return false;
}

//Color
/*
	: Color Class represent color data to manipulate or work with colors.
	
	__constructor(number r, number g, number b, number a)
	__constructor(number r, number g, number b)
	__constructor(number value)
		: store each channel values.

	r
		: 8-bit red channel value. 
	g
		: 8-bit green channel value. 
	b
		: 8-bit blue channel value. 
	a
		: 8-bit alpha channel value. 

	hex
		: get a color HEX code 
	rgbValue
		: get a color code formed rgb() or rgba().

*/
var Color = function() {
	var args = arguments;

	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = null;

	switch (args.length) {
		case 1 : {
			this.r = args[0];
			this.g = args[0];
			this.b = args[0];
			break;
		}
		case 3 : {
			this.r = args[0];
			this.g = args[1];
			this.b = args[2];
			break;
		}
		case 4 : {
			this.r = args[0];
			this.g = args[1];
			this.b = args[2];
			this.a = args[3];
			break;
		}
		default : {
			console.log("Color.constructor() requires only 1, 3, 4 arguments.");
			return false;
		}
	}

	Object.defineProperty(this, "hex", {
		get : function() {
			var r = this.r;
			var g = this.g;
			var b = this.b;
			var a = "";

			if (this.a){
				a = this.a;
				return "rgba("+r+g+b+a/255+")";
			}
			else {
				return "rgb("+r+g+b+")";				
			}

			return "#"+r+g+b+a;
		}, 
		set : function(value) {
			if (typeof value != "string") {
				console.log("cssColor must be a string data");
				return false;
			}
			
			if (value[0] == "#") {
				this.colorCode = value;
			}
			else if (value.substr(0,4) == "rgba") {
				var channelValues = value.split(/\((.+),(.+),(.+),(.+)\)/g);
				this.r = channelValues[0];
				this.g = channelValues[1];
				this.b = channelValues[2];
				this.a = channelValues[3];
			}
			else if (value.substr(0,3) == "rgb") {
				var channelValues = value.split(/\((.+),(.+),(.+)\)/g);
				this.r = channelValues[0];
				this.g = channelValues[1];
				this.b = channelValues[2];
				this.a = null;
			}
		}
	});

	Object.defineProperty(this, "rgbValue", {
		get : function() {
			var r = this.r;
			var g = this.g;
			var b = this.b;
			var a = this.a;
			if (a){
				a = a/255;
				return "rgba("+r+","+g+","+b+","+a+")";
			}
			else {
				return "rgb("+r+","+g+","+b+")";
			}
		}, 
		set : function(value) {
			if (typeof value != "string") {
				console.log("colorCode must be a string data");
				return false;
			}
			this.r = value.substr(1,2).toString(16);
			this.g = value.substr(3,2).toString(16);
			this.b = value.substr(5,2).toString(16);
			this.a = null;
			if (value.length == 9){
				this.a = value.substr(7,2).toString(16);
			}
		}
	});
}


//NodeList.forEach 
/*

	for compatibility

*/
if (typeof NodeList.prototype.forEach == "undefined") {
	NodeList.prototype.forEach = function(callback, thisArg) {
		if (typeof callback == "function") {
			var listObject = this;
			for (var currentIndex in listObject) {
				var currentValue = listObject[currentIndex];
				if (currentValue instanceof Node) {
					if (typeof thisArg == "undefined") {
						callback(currentValue, currentIndex, listObject);
					}
					else {
						callback.call(thisArg, currentValue, currentIndex, listObject);
					}
				}
			}
		}
		else {
			console.log("the first argument of NodeList.forEach() must be a function");
		}
	}
}


//Cookie
/*
	: Cookie Static Class provide easy methods to control and manage cookies.

	void set(key, value, expireTime)
		: set a cookie with expireTime
	void unset(key)
		: unset a cookie
	string get(key)
		: get cookie value via key
	Object jsonDecode()
		: get cookie datas as json form

*/
var Cookie = {
	set : function(key, value, expireTime) {
		var data = key + "=" + value + ";";

		var date = new Date();
		var expireInMilisec = 0;
		
		if (typeof expireTime == "string") {
			switch (expireTime[expireTime.length-1]) {
				case "d" : {
					expireInMilisec = parseFloat(expireTime)*1000*60*60*24;
					break;
				}
				case "h" : {
					expireInMilisec = parseFloat(expireTime)*1000*60*60;
					break;
				}
				case "m" : {
					expireInMilisec = parseFloat(expireTime)*1000*60;
					break;
				}
				case "s" : {
					expireInMilisec = parseFloat(expireTime)*1000;
					break;
				}
				case "ms" : {
					expireInMilisec = parseFloat(expireTime);
					break;
				}
			}
		}
		else {
			expireInMilisec = expireTime;
		}

		var expires;
		date.setTime(date.getTime() + expireInMilisec);
		expires = "expires=" + date.toUTCString() + ";";

		document.cookie = data + expires + "path=/";
	},
	unset : function(key) {
		this.set(key,"",0);
	},
	get : function(key) {
		var data = this.jsonDecode();
		return data?data[key]:null;
	},
	jsonDecode : function() {
		var cookieData = "";
		
		if ((cookieData = document.cookie) != "") {
			var json_cookie = {}
			cookieData = document.cookie.split("; ");
			for (var i in cookieData) {
				//cookieData[i] = cookieData[i].replace(";","");
				cookieData[i] = cookieData[i].trim();
				if (cookieData[i][cookieData[i].length-1] == ";") {
					cookieData[i] = cookieData[i].substr(0, cookieData[i].length-1);
				}
				var splitPivotIndex = cookieData[i].trim().indexOf("=");
				var key = cookieData[i].substr(0, splitPivotIndex);
				var value = cookieData[i].substr(splitPivotIndex+1, ((cookieData[i].length) - (splitPivotIndex)));
				json_cookie[key] = value;
			}
			return json_cookie;
		}
		else {
			return null;
		}
	}
}