var CSSAnimator = function(targetElement/*object or string*/) {
	
	var self = this;
	var target = null;
	if (targetElement instanceof Element) {
		target = targetElement;
	}
	else if (typeof targetElement == "string") {
		target = document.getElementById(targetElement);
	}
	
	this.fps = 60;

	var animationLoop = null;
	var animationQueue = new Array();

	this.setAnimation = function(
		json_animationData
		/*
			properties,
			easing,
			duration
		*/
	) {
		animationQueue.push(json_animationData);
		return this;
	}

	this.animate = function() {
		if (!self.animationLoop && self.animationQueue.length) {
			var animationData = self.animationQueue.shift();
			var properties = animationData.properties;
			console.log(animationData);
			/*
			self.animationLoop = setInterval((function(styleDest, easing) {
				return function() {
					for (var propertyName in styleDest) {
						styleDest[propertyName];
					}
				}
			})(styleDest, easing), 1/self.fps);*/
		}
	}
}

/*

var Timeline = function() {

}

var Keyframe = function() {

}

*/