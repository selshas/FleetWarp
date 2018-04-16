//Component 2D Object Definitions
var Component2D = function() {
	var self = this;

	this.x = 0;
	this.y = 0;
	this.ox = 0;
	this.oy = 0;

	this.width = null;
	this.height = null;
	
	this.pivotX = 0;	//pivotX
	this.pivotY = 0;	//pivotY

	this.ResizeTo = function() {
	
	}

	this.computePivotCoord = function() {
		return	{
			x : this.width * this.pivotX,
			y : this.height * this.pivotY
		}		
	}

	this.transform = new CanvasTransform();
	this.draw;

	this.fillStyle = "black";
	this.strokeStyle = null;

	this.applyTransform = function(context) {
		context.translate(this.x, this.y);
		if (this.transform.rot%(Math.PI*2) != 0) {
			context.rotate(this.transform.rot % (Math.PI*2));
		}
		if (this.transform.xScale != 1 || this.transform.yScale !=1) {
			context.scale(this.transform.xScale, this.transform.yScale);	
		}
	}
}

var Component2D_Rect = function(x, y, width, height) {
	Component2D.call(this);
	var self = this;

	this.x = x;
	this.y = y;
	this.ox = x;
	this.oy = y;

	this.width = width;
	this.height = height;

	this.draw = function(context) {
		context.save();
		this.applyTransform(context);

		if (this.fillStyle) {
			context.beginPath();
			context.rect(-this.pivotX, -this.pivotY, this.width, this.height);
			context.closePath();

			context.fillStyle = this.fillStyle;
			context.fill();
		}
		if (this.strokeStyle) {
			context.beginPath();
			context.rect(this.pivotX, -this.pivotY, this.width, this.height);
			context.closePath();

			context.strokeStyle = this.strokeStyle;
			context.stroke();
		}
		context.restore();
	}
}
var Component2D_Circle = function(x, y, r) {
	Component2D.call(this);
	var self = this;

	this.x = x;
	this.y = y;
	this.ox = x;
	this.oy = y;

	this.r = r;

	this.draw = function(context) {
		context.save();
		this.applyTransform(context);

		if (this.fillStyle) {
			context.beginPath();
			context.arc(-this.pivotX, -this.pivotY, this.r, 0, Math.PI * 2, false);
			context.closePath();

			context.fillStyle = this.fillStyle;
			context.fill();
		}
		if (this.strokeStyle) {
			context.beginPath();
			context.arc(-this.pivotX, -this.pivotY, this.r, 0, Math.PI * 2, false);
			context.closePath();

			context.strokeStyle = this.strokeStyle;
			context.stroke();
		}
		context.restore();
	}
}
var Component2D_Image = function(x, y, src) {
	Component2D.call(this);
	var self = this;


	this.x = x;
	this.y = y;
	this.ox = x;
	this.oy = y;

	var isLoaded = false;

	var source = document.createElement("img");
	source.src = src;
	source.onload = function() {
		naturalWidth = (this.naturalWidth);
		naturalHeight = (this.naturalHeight);
		isLoaded = true;

		if (self.width == null)
		{
			self.width = this.naturalWidth;
		}
		if (self.height == null)
		{
			self.height = this.naturalHeight;
		}
	}

	this.strokeStyle = null;
	this.draw = function(context) {
		if (isLoaded) {
			context.save();
			this.applyTransform(context);
			context.drawImage(source, -this.pivotX, -this.pivotY, self.width, self.height);
			context.restore();
		}
	}
}

var Component2D_Video = function(src) {
	Component2D.call(this);

	this.x = 0;
	this.y = 0;
	this.ox = this.x;
	this.oy = this.y;

	var isLoaded = false;
	var naturalWidth = null;
	var naturalHeight = null;

	this.source = document.createElement("video");
	this.source.src = src;
	this.strokeStyle = null;

	this.source.play();
	this.play = function() {
		this.source.play();
	}
	this.pause = function() {
		this.source.pause();
	}
	this.stop = function() {
		this.source.pause();
		this.source.currentTime = 0;
	}
	this.toggleMute = function() {
		if (this.source.muted) {
			this.source.muted = false;
		}
		else {
			this.source.muted = true;
		}
	}

	Object.defineProperty(this, "loop", {
		get : function() {
			return loop;
		},
		set : function(value) {
			loop = value;
			if (value) {
				this.source.loop = true;
			}
			else {
				this.source.loop = false;
			}
		}
	});
	var self = this;
	this.source.addEventListener("loadedmetadata", function() {
		naturalWidth = this.videoWidth;
		naturalHeight = this.videoHeight;
		isLoaded = true;

		if (self.width == null) {
			self.width = this.naturalWidth;
		}
		if (self.height == null) {
			self.height = this.naturalHeight;
		}
	});

	this.draw = function(context) {
		if (isLoaded){
			var width = naturalWidth;
			var height = naturalHeight;

			context.save();
			if (this.width.substr(-1) == "%") {
				//percentagious size
				width = (parseFloat(self.width)/100) * context.canvas.width;
			}
			else {
				width = this.width;
			}

			if (this.height.substr(-1) == "%") {
				//percentagious size
				height = (parseFloat(self.height)/100) * context.canvas.height;
			}
			else {
				height = this.height;
			}

			this.applyTransform(context);
			context.drawImage(this.source, -this.pivotX * width, -this.pivotY * height, width, height);
			context.restore();
		}
	}
}

//Canvas Transform Struct
var CanvasTransform = function() {
	this.xPos = 0;
	this.yPos = 0;
	this.rot = 0;
	this.xScale = 1;
	this.yScale = 1;

	this.translate = function(x, y) {
		this.xPos = x;
		this.yPos = y;
	}
	this.rotate = function(radian) {
		this.rot = radian;
	}
	this.scale = function(x, y) {
		this.xScale = x;
		this.yScale = y;
	}
}


//buffer classes
var maskBuffer = function() {
	this.canvas = document.createElement("canvas");
	this.context2D = this.canvas.getContext("2d");
	this.direction = "in";
}
var backBuffer = function() {
	this.canvas = document.createElement("canvas");
	this.context2D = this.canvas.getContext("2d");
}


//Canvas Main Class
var Canvas = function(canvasElementID) {

	this.active = true;

	//OutputCanvas
	this.canvasElement = document.getElementById(canvasElementID);
	if (!this.canvasElement) {
		console.log("Element '"+canvasElementID+"' does not exist.");
		return false;
	}
	this.canvasElement.width = parseInt(window.getComputedStyle(this.canvasElement, null).width);
	this.canvasElement.height = parseInt(window.getComputedStyle(this.canvasElement, null).height);

	//get Context
	this.context2D = this.canvasElement.getContext("2d");

	//mask buffer
	this.maskBuffer = new maskBuffer();
	this.maskBuffer.canvas.width = this.canvasElement.width;
	this.maskBuffer.canvas.height = this.canvasElement.height;
	
	//layer buffer
	this.backBuffer = new backBuffer();
	this.backBuffer.canvas.width = this.canvasElement.width;
	this.backBuffer.canvas.height = this.canvasElement.height;

	this.prevTimestamp;
	
	//initialize Layer
	this.layers = new Array();
	this.newLayer = function() {
		var layerData = {
			maskComponents : new Array(),
			visualComponents : new Array()
		}
		this.layers.push(layerData);
		return this.layers.length-1;
	};				
	this.newLayer();

	//Initial layer
	this.currentLayer = 0;
	this.maskMode = false;

	// draw 2DComponents
	this.drawCircle = function(x, y, r) {
		var newCircle = new Component2D_Circle(x, y, r);
		if (this.maskMode){
			this.layers[this.currentLayer].maskComponents.push(newCircle);
		}
		else {
			this.layers[this.currentLayer].visualComponents.push(newCircle);
		}
		return newCircle;
	}
	this.drawImage = function(x, y, src) {
		var newImage = new Component2D_Image(x, y, src);
		if (this.maskMode){
			this.layers[this.currentLayer].maskComponents.push(newImage);
		}
		else {
			this.layers[this.currentLayer].visualComponents.push(newImage);
		}
		return newImage;
	}
	this.drawVideo = function(x, y, src) {
		var newVideo;
		if (src instanceof Component2D_Video) {
			newVideo = src;
		}
		else {
			newVideo = new Component2D_Video(src);
		}
		newVideo.x = x;
		newVideo.y = y;

		if (this.maskMode){
			this.layers[this.currentLayer].maskComponents.push(newVideo);
		}
		else {
			this.layers[this.currentLayer].visualComponents.push(newVideo);
		}
		return newVideo;
	}

	//loop callback for each frame.
	var self = this;
	this.updateCallback = function(timestamp) {
		if (self.active) {
			//get deltaTime
			var deltaTime = (timestamp - self.prevTimestamp)/1000;
			var context2D = self.context2D;
			
			//show FPS
			//console.log(1/deltaTime);

			//clear Canvas
			context2D.clearRect(0,0,self.canvasElement.width,self.canvasElement.height);
			self.maskBuffer.context2D.clearRect(0,0,self.canvasElement.width,self.canvasElement.height);
			context2D.save();

			//loop all layers
			for (var i=0; i<self.layers.length; i++) {
				context2D.save();
				self.maskBuffer.context2D.save();
				//draw mask layer of current layer to self.maskBuffer
				if (self.layers[i].maskComponents.length)
				{
					var component = null;
					for (var j=0;j<self.layers[i].maskComponents.length;j++) {
						component = self.layers[i].maskComponents[j];
						component.fillStyle = "black";
						component.draw(self.maskBuffer.context2D);
						delete component;
					}
				}
				else {
					//set whole area to drawable
					self.maskBuffer.context2D.beginPath();
					self.maskBuffer.context2D.rect(0,0, self.maskBuffer.canvas.width,self.maskBuffer.canvas.height);
					self.maskBuffer.context2D.fill();
					self.maskBuffer.context2D.closePath();
				}

				//if the layer has components, draw all the components
				if (self.layers[i].visualComponents.length)
				{
					var component = null;
					for (var j=0;j<self.layers[i].visualComponents.length;j++) {
						component = self.layers[i].visualComponents[j];

						//initialize back buffer
						self.backBuffer.context2D.clearRect(0,0,self.backBuffer.canvas.width, self.backBuffer.canvas.height);
						self.backBuffer.context2D.globalCompositeOperation = "source-over";
						self.backBuffer.context2D.drawImage(self.maskBuffer.canvas, 0,0);

						self.backBuffer.context2D.globalCompositeOperation = "source-in";
						self.backBuffer.context2D.save();

						component.draw(self.backBuffer.context2D);
						
						var layerImage = self.backBuffer.canvas;
						context2D.drawImage(layerImage, 0,0);

						self.backBuffer.context2D.restore();
					}
				}
				context2D.restore();
				self.maskBuffer.context2D.restore();
			}
			context2D.restore();

			//refresh timestamp, loop to next frame.
			self.prevTimestamp = timestamp;
		}
		window.requestAnimationFrame(self.updateCallback);
	}
	this.updateCallback();
}//Canvas End

//canvas Animator
var CanvasAnimator = function (targetComponent) {
	this.target = targetComponent;
	this.animationQueue = new Array();
	this.animationLoop = null;

	this.loop = false;

	this.setAnimation = function (propertyToChange) {
		if (typeof propertyToChange != "object") {
			console.error("animate(propertyToChange) method requires JSON type object.");
			return false;
		}
		this.animationQueue.push(propertyToChange);
		return this;
	}
	this.animate = function() {
		var animationData;
		var self = this;
		setInterval(function() {
			if (!self.animationLoop) {
				if (self.animationQueue.length > 0) {
					animationData = self.animationQueue.shift();
					if (self.loop) {
						self.animationQueue.push(animationData);
					}

					var duration = animationData.duration;
					var easing = (typeof animationData.easing == "undefined")?Easing.linear:animationData.easing;
					var delay = (typeof animationData.delay == "undefined")?0:animationData.delay;

					var t = 0;
					var properties = animationData.properties;
					var duration = animationData.duration;
					var target = self.target;

					var beginValues = new Array();
					var endValues = new Array();
					var deltaValues = new Array();
					for (propertyName in properties) {
						beginValues[propertyName] = target[propertyName];
						endValues[propertyName] = properties[propertyName];
						deltaValues[propertyName] = endValues[propertyName] - beginValues[propertyName];
					}
					var animationLoop = self.animationLoop = function(timestamp) {
						t+=16;
						for (propertyName in properties) {
							target[propertyName] = easing(beginValues[propertyName], deltaValues[propertyName], t, duration);
						}
						if (t>=duration) {
							clearInterval(self.animationLoop);
							self.animationLoop = null;
						}
						else {
							window.requestAnimationFrame(animationLoop);
						}
					}
					setTimeout(animationLoop, delay);
				}
			} // if (!self.animationLoop)
		});
	}
};