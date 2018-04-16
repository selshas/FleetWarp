//Easing
/*
	: Easing Static Class contains easing functions, which can use to animation or interpolation.
*/
var Easing = {
	linear : function(b, c, t, d) {
		t/=d;
		if (t > 1 || d == 0) {
			t = 1;	
		}
		return c*t + b;
	},
	easeIn : function(b, c, t, d) {
		if (t>d)
			t=d;
		var t = t/d;
		return c*(t*t)+b;
	},
	easeOut : function(b, c, t, d) {
		if (t>d)
			t=d;
		var t = t/d;
		return -c*(t*(t-2))+b; 
	},
	easeInOut : function(b, c, t, d) {
		if (t>d)
			t=d;
		var t = t/(d*0.5);
		if (t<1) {
			return c/2*(t*t)+b;
		}
		else {
			t-=1;
			return -c/2*(t*(t-2)-1)+b;
		}
	},
	sinEaseOut : function(b, c, t, d) {
		var pi = Math.round(Math.PI*10000)/10000;
		if (t>d)
			t=d;
		var t = (t/d) * (pi*0.5);
		return c*Math.sin(t)+b;
	},
	sinEaseIn : function(b, c, t, d) {
		var pi = Math.round(Math.PI*10000)/10000;
		if (t>d)
			t=d;
		var t = (t/d) * (pi*0.5);
		return c*(Math.sin(t)+1)+b;
	}
}