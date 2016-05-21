"use strict";

// 360i BOILERPLATE

// ! i360 Library

// Polyfill indexOf for arrays (IE8 and below)
// Needed for DOM class manipulation
(function() {
	if([].indexOf) {
		return false;
	}

	Array.prototype.indexOf = function(val) {
		var len = this.length;
		for(var x=0;x<len;++x) {
			if(this[x] === val) {
				return x;
			}
		}
		return -1;
	};
})();

var i360 = {
		// ! METHODS

		// Operate on collections
		all: function(obj, func) {
			var len = !obj.nodeName && obj !== window && obj.length;
			if(len) {
				var arr = [],
					ret;
				for(var x=0;x<len;++x) {
					ret = func.call(obj[x], x);
					(ret || ret === undefined) && arr.push(obj[x]);
				}

				return arr;
			} else if(len === 0) {
				return false;
			} else if(obj.constructor === Object) {
				var x = -1;
				for(var prop in obj) {
					func.call(prop, ++x);
				}
			} else {
				func.call(obj, 0);
			}

			return obj;
		},
		has: function(el, str) {
			// Use native if avail
			if(el.classList) {
				return el.classList.contains(str);
			}

			return !!el.getAttribute('class') && !!~el.getAttribute('class').split(' ').indexOf(str);
		},
		add: function(el, str) {
			return i360.all(el, function() {
				var el = this;

				// Use native if avail
				if(el.classList) {
					el.classList.add(str);
					return el;
				}

				if(!i360.has(el, str)) {
					var initClass = el.getAttribute('class') || '';

					var classArr = initClass.split(' ');
					classArr.push(str);
					el.setAttribute('class', classArr.join(' '));
					return el;
				}
				return false;
			});
		},
		rmv: function(el, str) {
			return i360.all(el, function() {
				var el = this;

				// Use native if avail
				if(el.classList) {
					el.classList.remove(str);
					return el;
				}

				if(i360.has(el, str)) {
					var initClass = el.getAttribute('class') || '';

					var classArr = initClass.split(' '),
						classDex = classArr.indexOf(str);
					classArr.splice(classDex,1);
					el.setAttribute('class', classArr.join(' '));
				}
				return false;
			});
		},
		tog: function(el, str) {
			return i360.all(el, function() {
				var el = this;

				// Use native if avail
				if(el.classList) {
					el.classList.toggle(str);
					return el;
				}

				if(!i360.has(el, str)) {
					i360.add(el, str);
				} else {
					i360.rmv(el, str);
				}
			});
		},
		// ! EVENTS
		evt: function(el, type, func, del) {
			if(!el) {
				console.error('i360.evt: The element you gave me does not exist.');
				debugger;
				return false;
			}

			if(del) {
				var delFunc = func;
				func = function(e) {
					var elTrgt = e.target || e.srcElement,
						qDel = el.querySelectorAll(del);

					for(var x=0, len=qDel.length;x<len;++x) {
						if(elTrgt === qDel[x]) {
							return delFunc.call(elTrgt, e);
						}
					}
				};
			}

			el = i360.all(el, function() {
				var el = this;

				// Native tap event for touchscreens
				if(type === 'tap') {
					var initX,
						initY,
						didMove,
						touch;
					el.addEventListener('touchstart', function(e) { // Detect initial touch location
						var initClass = el.getAttribute('class') || '';

						el.setAttribute(
							'class',
							initClass + ' pressed'
						);

						e = touch = e.targetTouches[0];

						initX = e.clientX;
						initY = e.clientY;
						didMove = false;
					});
					el.addEventListener('touchmove', function(e) {
						e = e.targetTouches[0];

						// Did they move their finger more than 5 pixels (i.e. are they scrolling)?
						didMove =
							Math.abs(e.clientX - initX) > 5 || Math.abs(e.clientY - initY) > 5;

						var initClass = el.getAttribute('class') || '';

						if(didMove) {
							el.setAttribute(
								'class',
								initClass.replace(/ pressed/g, '')
							);
						} else if(!~initClass.indexOf(' pressed')) {
							el.setAttribute(
								'class',
								initClass + ' pressed'
							);
						}
					});
					el.addEventListener('touchend', function(e) {
						e.preventDefault();

						var initClass = el.getAttribute('class') || '';

						el.setAttribute(
							'class',
							initClass.replace(/ pressed/g, '')
						);

						if(didMove) { // If finger moved, do nothing
							return false;
						} else { // Otherwise, go
							func.call(el, touch);
						}
					});

					// Attach mousedown event for hybrid touch/mouse devices
					// Condition prevents double-fire on stock Android Browser
					if(
						!~navigator.userAgent.indexOf('Android')
						|| ~navigator.userAgent.indexOf('Android')
							&& (
								~navigator.userAgent.indexOf('Chrome')
								|| ~navigator.userAgent.indexOf('Firefox')
							)
					) {
						el.addEventListener('mousedown', func, false);
					}

					return false;
				}

				// Standard and IE<9 listeners
				if(document.addEventListener) {
					el.addEventListener(type, func, false);
				} else {
					el.attachEvent('on'+type, function(e) {
						func.call(el, e);
					});
				}
			});

			if(!el) {
				console.error('i360.evt: There are no nodes in the collection you gave me.');
				debugger;
				return false;
			}

			return el;
		},
		// ! AJAX
		xhr: function(url, inps, success, type, opts) {
			// NORMALIZE ARGUMENTS
			type = type && type.toUpperCase() || 'GET';
			opts = opts || {};

			// Setup optional parameters
			var defOpts = {
					accept: 'json',
					failure: function() {},
					headers: {},
					async: true
				};
			for(var opt in defOpts) {
				opts[opt] === undefined && (opts[opt] = defOpts[opt]);
			}

			switch(opts.accept) {
				case 'json':
					opts.headers['Accept'] = 'application/json';
					break;
				case 'jsonp':
					opts.headers['Accept'] = 'application/javascript';
					break
				case 'xml':
					opts.headers['Accept'] = 'application/xml';
					break;
				default:
					opts.headers['Accept'] = opts.accept;
					break;
			}

			// XHR input as <form>
			if(inps.nodeName && inps.nodeName === 'FORM') {
				var qInputs = inps,
					elInput;
				inps = {};
				for(var x=0, len=qInputs.length;x<len;++x) {
					elInput = qInputs[x];

					if(elInput.nodeName !== 'INPUT' && elInput.nodeName !== 'SELECT') {
						continue;
					}

					inps[elInput.name] = elInput.value;
				}
			}
			// Serialize object into string (also handle result of <form> input)
			if(inps && typeof inps !== 'string') {
				var inpStr = [];
				for(var inp in inps) {
					inpStr.push(inp+'='+inps[inp]);
				}
				inps = inpStr.join('&');
			}
			// Append to URL if GET
			if(type === 'GET') {
				url += '?' + inps;
			}

			if(opts.accept === 'jsonp') {
				var jsonpCallback = 'i360jsonp_' + new Date().getTime();
				window[jsonpCallback] = function(json) {
					success.call(window, json);

					elJsonp.parentNode.removeChild(elJsonp);
				};
				url +=
					url.indexOf('?') === url.length-1
						? 'callback='+jsonpCallback
						: '&callback='+jsonpCallback;

				var elJsonp = document.createElement('script');
				elJsonp.async = true;
				elJsonp.src = url;
				var elScript = document.getElementsByTagName('script')[0];
				elScript.parentNode.insertBefore(elJsonp, elScript);

				return 'jsonp';
			}

			// MAKE XHR
			var xhr = new XMLHttpRequest();
			xhr.open(type, url, opts.async);
			xhr.onreadystatechange = function(e) {
				// Done?
				if(xhr.readyState === 4) {
					// Any status beyond 200s is a "failure"
					xhr.status < 300
						? success.call(
							e,
							opts.accept === 'json'
								? JSON.parse(xhr.responseText)
								: xhr.responseText
						)
						: opts.failure.call(e, xhr.responseText);
				}
			}

			// Request headers
			for(var hdr in opts.headers) {
				xhr.setRequestHeader(hdr, opts.headers[hdr]);
			}

			xhr.send(
				type === 'GET'
					? null
					: inps
			);

			return xhr;
		},
		// ! VENDOR PREFIXES
		// "Defix" a method
		// or assign a value to a property
		dfx: function(obj, prop, val) {
			var capable = false,
				pfxProp = prop;
			if(prop in obj) {
				capable = true;
			} else {
				pfxProp = pfxProp.substring(0,1).toUpperCase() + pfxProp.substring(1);

				for(
					var x = 0,
						vendors = ['Webkit', 'webkit', 'WebKit', 'Moz', 'moz', 'Ms', 'ms', 'MS', 'O', 'o'],
						len = vendors.length;

					x<len;
					++x
				) {
					if(vendors[x]+pfxProp in obj) {
						pfxProp = vendors[x]+pfxProp;
						capable = true;
					}
				}
			}

			return capable && (function() {
				if(val !== undefined) {
					obj[pfxProp] = val;
					return pfxProp;
				} else {
					obj[prop] = obj[pfxProp];
					return obj[prop];
				}
			})();
		}
	};
// ! i360 SHORTCUT
if(_) {
	console && console.log('i360: _ already exists - conflicts may occur!!');
	for(var method in i360) {
		_[method] = i360[method];
	}
} else {
	var _ = i360;
}

// ! CROSS-PLATFORM PROPERTIES

// Text Get-Set
var txtProp =
		'textContent' in document.createElement('div')
			? 'textContent'
			: 'innerText';

// CSS Transformations
var transformProp = _.dfx(document.body.style, 'transform', 'foo');

// CSS Transitions
var transitionProp = _.dfx(document.body.style, 'transition', 'foo');

// Events
var pntEvt =
		'ontouchstart' in window
			? 'tap'
			: 'mousedown',
	dwnEvt =
		'ontouchstart' in window
			? 'touchstart'
			: 'mousedown',
	movEvt =
		'ontouchmove' in window
			? 'touchmove'
			: 'mousemove',
	upEvt =
		'ontouchend' in window
			? 'touchend'
			: 'mouseup',
	keyEvt =
		'oninput' in window
			? 'input'
			: 'keyup';

// Polyfill requestAnimationFrame & cancelAnimationFrame
(function() {
	_.dfx(window, 'requestAnimationFrame');
	var lastTime = new Date().getTime();
	window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
		var currTime = new Date().getTime(),
			refreshTime = Math.max(0, 16 - (currTime-lastTime));

		lastTime = currTime + refreshTime;

		return window.setTimeout(
			function() {
				callback(lastTime);
			},
			refreshTime
		);
	};

	_.dfx(window, 'cancelAnimationFrame');
	window.cancelAnimationFrame = window.cancelAnimationFrame || function(to) {
		clearTimeout(to);
	};
})();


// ! SITEWIDE

var elBrowser = document.getElementById('browser'),
	elName = document.getElementById('browser-name'),
	elVersion = document.getElementById('browser-version'),
	elMonth = document.getElementById('chrome-circa-month'),
	elYear = document.getElementById('chrome-circa-year'),
	qSelect = document.querySelectorAll('#select > span');

var pickBrowser = function() {
		var browser = this.className,
			pct = parseInt(browserPct[browser].pct, 10);

		elBrowser.className = browser;
		elName[txtProp] = this[txtProp];
		elVersion[txtProp] = browserPct[browser].version;

		var date = [],
			month = "",
			year = "";

		chromePct.every(function(crPct) {
			if(pct < parseInt(crPct, 10)) {
				return true;
			}

			date = chromeMiles[crPct].split('-');
			month = monthCodes[parseInt(date[1], 10)];
			year = date[0];

			return false;
		});

		elMonth[txtProp] = month;
		elYear[txtProp] = year;
	};

_.evt(qSelect, pntEvt, pickBrowser);

pickBrowser.call(qSelect[0]);