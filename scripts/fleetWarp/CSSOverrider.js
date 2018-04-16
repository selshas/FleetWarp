//CSSOverrider
/*
	: CSSOverrider Static Class is used to manipulate stylesheet directly without style attribute of Element. It is useful to modify entire elements matched selector;
	

*/



var CSSOverrider = {
	activate : function() {
		if (this.styleElement.parentNode) {
			this.styleElement.detach();
		}
		this.styleElement.attachTo(document.body);
	},
	styleSheets : document.styleSheets,
	styleElement : (function() {
		return styleElement = document.createElement("style");
	})(),
	newRule : function(selector, json_properties, isImportant = false) {
		if (typeof selector != "string") {
			errorThrow(new TypeError("The first argument of CSSOverrider.newRule() must be a string."));
			return false;
		}
		if (!isObject(json_properties)) {
			errorThrow(new TypeError("The second argument of CSSOverrider.newRule() must be a json type object."));
			return false;
		}

		if (typeof isImportant != "undefined" && isImportant != false && isImportant != true) {
			errorThrow(new TypeError("The third argument of CSSOverrider.newRule() must be a boolean type or droped from call."));
			return false;
		}
		
		var styleSheets = this.styleSheets;
		var bool_selectorExists = false;
		for (var i in styleSheets) {
			var stylesheet = styleSheets[i];
			var cssRules = null;
			try {
				cssRules = stylesheet.rules;
			}
			catch (error) {
				continue;
			}
			if (cssRules) {
				var cssRules = stylesheet.rules;
			console.log(cssRules);
				for (var j in cssRules) {
					var cssRule = cssRules[j];
					if (cssRule.selectorText == selector) {
						// !!!!!!!!!!!!!!!!!!!!!! there could be multiple rules matching same selector.
						for (var propertyName in json_properties) {
							var value = json_properties[propertyName];
							cssRule.style[propertyName] = value;
						}
						bool_selectorExists = true;
					}
				}
			}
		}
		if (!bool_selectorExists) {
			//the selector does not exist.
			this.customRuleContainer.innerHTML = selector + " {}";
			this.newRule(selector, json_properties, isImportant);
		}
	},
	getStyle : function(selector) {
		var styleSheets = this.styleSheets;
		var bool_selectorExists = false;
		var array_matchingRules = new Array();
		for (var i in styleSheets) {
			//select Stylesheet
			if (styleSheets[i].rules != null) {
				var cssRules = styleSheets[i].rules;
				for (var j in cssRules) {
					//search the matching selector rules.
					if (cssRules[j].selectorText == selector) {
						array_matchingRules.push(cssRules.style);
					}
				}
			}
		}
		return array_matchingRules;
	},
	getPropertyValue :function(selector, propertyName) {
		var style;
		if (style = this.getStyle(selector)) {
			return style[propertyName];
		}
		return false;
	}
}