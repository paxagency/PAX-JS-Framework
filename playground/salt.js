/*! Salt.js DOM Selector Lib. By @james2doyle */
window.$ = function(selector, context, undefined) {
	
	if( selector == undefined) console.log("undefined selector");
	if(typeof selector === "undefined") return [];
	
	if(typeof selector !="string") return selector;
	
  if(selector[0]!='#' && selector[0]!='.' && selector[0]!='@' && selector[0]!='*' && selector[0]!='=') selector = '*'+selector;
 
  var matches = {
    '#': 'getElementById',
    '.': 'getElementsByClassName',
    '@': 'getElementsByName',
    '=': 'getElementsByTagName',
    '*': 'querySelectorAll'
  }[selector[0]]; 

  var el = (context === undefined) ? document[matches](selector.slice(1)) : context[matches](selector.slice(1) );

  if(typeof el === "undefined" || !el.length)  return [];
  return (el.length < 2) ? el[0]: el;
};




Element.prototype.hide = function hide() {this.style.display = "none";}
Element.prototype.show = function show(s) {if(!s) s="block"; this.style.display = s;}
Element.prototype.find = function find(qu) {var q = $(qu,this); return (q && q.length) ? q[0] : q ;}
Element.prototype.addClass = function addClass(cls) {this.classList.add(cls);return this;}
Element.prototype.removeClass = function removeClass(cls) {this.classList.add(cls);return this;}
Element.prototype.html = function html(html) {return (typeof html === 'string') ? this.innerHTML=html : this.innerHTML;}
Element.prototype.append = function append(html) { this.insertAdjacentHTML('afterEnd', html); return this;}
Element.prototype.prepend = function prepend(html) {this.insertAdjacentHTML('beforeBegin', html); return this;}
Element.prototype.val = function addClass(vl) {return (vl) ? this.value=vl : this.value;}
Element.prototype.attr = function(name,string) {
	return (typeof string === "undefined") ? this.getAttribute(name) : this.setAttribute(name,string);
}
Element.prototype.hasAttr = Element.prototype.hasAttribute;
Element.prototype.css = function(prop, value) {
  if (value) {
    this.style[prop] = value;
    return this;
  } else {
    return this.style[prop];
  }
};
Element.prototype.on = function(eventType, callback) {
  eventType = eventType.split(' ');
  for (var i = 0; i < eventType.length; i++) {
    this.addEventListener(eventType[i], callback);
  }
  return this;
};

Element.prototype.each = function(fun){if(this) fun.call(this,0,this)};
Array.prototype.each = function(fun){
	if(!this.length) return 0;
	for (i = 0; i < this.length; i++) { 
		fun(i,this[i]);
	}
};

window.$.each = function(a,fun){
	if(typeof a === "undefined" || !a) return false;
	if(a instanceof Array) {
		if(!a.length) return 0;
		for (i = 0; i < a.length; i++) { 
			fun(i,a[i]);
		}
	} else {
		var a = JSON.parse(JSON.stringify(a));
		
		for (var key in a) {
			fun(key,a[key]);
		}
	}
};

NodeList.prototype.each = function each(fun) {
	for (i = 0; i < this.length; i++) { 
		fun.call(this[i],i,this[i]);
	}
}

NodeList.prototype.hide = function hide() {
	this.each(function(e) {
			if(e.nodeType==1) e.style.display = "none"; 
		}
	)
}
NodeList.prototype.show = function show(s) {
	if(!s) s="block";
	this.each(function(e) {if(e.nodeType==1) e.style.display = s;});
}

NodeList.prototype.addClass = function addClass(cls) {
	this.each(function(e) {
		if(e.nodeType==1) e.classList.add(cls);
  	});
  return this;
}
NodeList.prototype.removeClass = function removeClass(cls) {
	this.each(function(e) {if(e.nodeType==1) e.classList.remove(cls)});
    return this;
}
NodeList.prototype.val = function val(vl) {
	this.each(function(t) {
         (vl) ? t.value=vl : t.value;
    });
    return this;
}
NodeList.prototype.css = function(prop, value) {
  this.each(function(e) {
		 if(e.nodeType==1)  e.css(prop, value);
  });
  return this;
};
NodeList.prototype.on = function(eventType, callback){
  this.each(function(e){
    if(e.nodeType==1) e.on(eventType, callback);
  });
  return this;
};
window.$.ready = (callback) => {
  if (document.readyState != "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
}
document.ready = (callback) => {
  if (document.readyState != "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
}

