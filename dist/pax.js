var $pax = function(o) {};
$pax.prototype = {
  url:[],
  routes:{},
  routeTags:{},
  routeHash:0,
  apps:{},
  appLength:0,
  appIndex:0,
  routeFade:1,
  routeMove:1,
  appGlob:[],
  appInit:[],
  el:{routes:'#routes'},
  loadTemplate:`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position:absolute; left:50%; top:50%;max-width:50px; margin-left:-25px;margin-top:-125px; display: block; shape-rendering: auto;" width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" cy="50" fill="none" stroke="blue" stroke-width="4" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
    <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform></circle></svg>`,
  init:function(o){
    var self = this;
    //Set templates
    document.querySelectorAll('template').forEach(function(element){
      var key = element.getAttribute('app');
      var template = element.innerHTML;

      if(typeof key !== 'undefined') {
        var url = key.split('_').join('/');
        key = key.split('-').join('_');
        if(url=="index") url = "";
        if(!self.apps[key]) self.apps[key] = {};
        if(!self.apps[key].template) self.apps[key].template = template;
        if(!self.apps[key].url) self.apps[key].url = "/"+url;
      }
    });
    //Set app defaults and routes
    Object.entries(this.apps).forEach(function([k, o]){
      self.setDefaults(o);
      if(o.url) {
        self.routes[o.url] = k;
        o.root = self.el.routes;
      } else {
        if(o.global) {
          self.appGlob.push(k);
        } else if(!o.ignore){
          self.appInit.push(k);
        } 
      }
    }); 

    this.setRouter();

    //load global apps, then non-routed apps
    this.loadApps(self.appGlob,function(){
      (Object.keys(self.routes).length === 0) ? self.loadApps(self.appInit) : self.routing();
    });
    Object.entries(this.apps).forEach(function([k, o]){
    	self.mirror(k);
    });
    
  },
  setDefaults:function(o){
    o.root = (o.root) ? o.root : 0;
    o.el = (o.el) ? o.el : {};
    o.tag = (o.tag) ? o.tag : {};
    o.data = (o.data) ? o.data : {};
    o.values = (o.values) ? o.values : {};
    o.str = (o.str) ? o.str : {};
    o.templates = (o.templates) ? o.templates : {};
    o.filters = (o.filters) ? o.filters : {};
    o.change = (o.change) ? o.change : {};
    return o;
  },
  loadApps:function(array, fun){
    var self = this;
    var total = array.length;
    var index = 0;
    if(!array.length && fun) fun();
    
    array.forEach(function(key){
      var app = self.apps[key];
      if(app.init) app.init();
      app.load_total = (app.load) ? Object.keys(app.load).length : 0;
      app.load_index = 0;
      if(!app.load_total) {
        self.initApp(key);
        index++;
        if(index==total && fun) fun();
      }
      if(app.load) {
      Object.entries(app.load).forEach(function([k, o]){
        if(o.url) {
          var query = (o.query) ? o.query : 0;
          self.ajax(o.url,query,function(e){
            self.setLoad(key,k,e);
            app.load_index++;
            if(app.load_index==app.load_total) {
              self.initApp(key);
              index++;
            }
            if(index==total && app.load_index==app.load_total && fun) fun();
          });
        
        }
      });
      }
    });
  },
  setLoad:function(key,k,e){
    var app = this.apps[key];
    app.load[k].data = e;
    if(app.load[k].setData) app.data[k] = (e.hits) ? e.hits : e;
    if(app.load[k].loaded) this.call(e,app.load[k].loaded);
  },
  call:function(v,f){
    var exp = f.split('.');
    var obj= window['app'];
    exp.forEach(function(k){
      obj = obj[k];
    });
    return (v) ? obj(v) : obj(0);
  },
  initApp:function(key) {
    var self =this;
    var app = this.apps[key];
    
    if(!app.root && document.querySelector('[app="'+key+'"]')) app.root = '[app="'+key+'"]';
    if(app.loaded) app.loaded();
    if(app.root) this.renderApp(key);
    if(app.ready) app.ready();
  },
  renderApp:function(key){
    var self = this;
    var app = this.apps[key];
    app.set = function(id,val,mode){pax.set(key,id,val,mode);}
    app.push = function(id,val,index){pax.push(key,id,val,index);}
    app.pop = function(id,val){pax.pop(key,id,val);}
    app.render = function(){pax.renderChildren(key);}
    if(!app.template) app.template = document.querySelector(app.root).innerHTML;
    
    document.querySelectorAll(app.root).forEach(function(o) {
      o.innerHTML = self.rendTemplate(key); 
    });
    
    this.renderChildren(key);
    if(app.root==pax.el.routes){
      if(self.routeFade) {
        document.querySelector(app.root).setAttribute("style","transition:none;opacity:0;");
        setTimeout(function(){document.querySelector(app.root).setAttribute("style","opacity:1; transition: opacity .3s;");},10);
      }
      if(self.routeMove) window.scrollTo({top: 0, behavior: 'smooth'});
    }
  },
  renderChildren: function(key) {
    if (!key || key === undefined) alert("NO");

    var self = this;
    var app = this.apps[key];
	
    
   
    document.querySelector(app.root).querySelectorAll("[app]").forEach(function(o) {
       o.querySelectorAll("[bind]").forEach(function(children) {
        children.setAttribute("children", children.getAttribute("bind"));
        children.removeAttribute("bind");
      });
    });
    
    document.querySelector(app.root).querySelectorAll("[bind]").forEach(function(o) {
      var tag = o.tagName;
      var id = o.getAttribute('bind');
	
      if (id == "") return false;
		
      app.el[id] = o;
      if (tag == 'TEMPLATE') return false;
      if (tag == 'SELECT' && o.hasAttribute('multiple')) tag = 'MULTIPLE';
      if (tag == 'INPUT' && o.getAttribute('type') == 'checkbox') tag = 'CHECKBOX';
      if (tag == 'INPUT' && o.getAttribute('type') == 'radio') tag = 'IGNORE';
      if (tag == 'INPUT' && o.getAttribute('type') == 'button') tag = 'BUTTON';
      if (tag == 'INPUT' && o.getAttribute('type') == 'submit') tag = 'BUTTON';
      if (o.getAttribute('bind-type')) tag = o.getAttribute('bind-type').toUpperCase();
      app.tag[id] = tag;
      var html = o.innerHTML;

      if (!app.templates[id] && html.indexOf('{{') >= 0) app.templates[id] = html;

      switch (tag) {
        case 'UL':
        case 'OL':
          if (!app.templates[id]) app.templates[id] = '<li data-index="{{index}}">{{value}}</li>';
			
          if (app.data[id]) {
            self.render(key, id);
          } else {
            app.data[id] = [];
            o.querySelectorAll('li').forEach(function(li) {
              app.data[id].push(li.innerHTML);
            });
          }
          break;
        case 'RADIO':
          if (!app.templates[id]) app.templates[id] = "<label><input type='radio' value='{{this.id}}' name='" + id + "'>{{this.text}}</label> ";
          if (app.data[id]) {
            app.el[id].innerHTML = self.render(key, id);
          } else {
            app.data[id] = [];
            app.el[id].querySelectorAll('input[name="' + id + '"]').forEach(function(li) {
              app.data[id].push({
                id: li.value,
                text: li.innerHTML
              });
            });
          }
          if (app.values[id]) app.el[id].querySelector('input[name="' + id + '"][value="' + app.values[id].id + '"]').checked = true;
          app.el[id].querySelectorAll('input[name="' + id + '"]').forEach(function(li) {
            li.addEventListener('change', function(e) {
              self.setData(key, id);
            });
          });
          break;
        case 'CHECKBOX':
          if (app.data[id]) {
            var checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('name', id);
            checkbox.setAttribute('bind', id);
            var label = document.createElement('label');
            label.appendChild(checkbox);
            label.innerHTML += app.data[id].text;
            app.el[id].parentNode.innerHTML = label.outerHTML;
            if (app.data[id].id) checkbox.checked = true;
          } else {
            app.data[id] = {
              id: 0,
              text: o.parentNode.innerHTML
            };
          }
          app.el[id].addEventListener('change', function(e) {
            self.setData(key, id);
          });
          break;
        case 'INPUT':
          if (app.data[id] || app.data[id] === 0) {
            o.value = app.data[id];
          } else {
            app.data[id] = o.value;
          }
          
          app.el[id].addEventListener('keyup', function(e) {
        
            self.setData(key, id);
          });
          break;
        case 'TEXTAREA':
          if (app.data[id]) {
            o.innerHTML = app.data[id];
          } else {
            app.data[id] = o.innerHTML;
          }
          app.el[id].addEventListener('focusout', function(e) {
            self.setData(key, id);
          });
          break;
        case 'SELECT':
          if (!app.templates[id]) app.templates[id] = "<option value='{{this.id}}'>{{this.text}}</option>";
          
          if (app.data[id]) {
            app.el[id].innerHTML = self.render(key, id);
          } else {
            app.data[id] = [];
            app.el[id].querySelectorAll('option').forEach(function(li) {
              app.data[id].push({
                id: li.value,
                text: li.innerHTML
              });
            });
          }
          if (app.values[id]) app.el[id].value = app.values[id].id;
          if (!app.values[id] && app.data[id][0].id!="") app.values[id] = app.data[id][0];
          app.el[id].addEventListener('change', function(e) {
            self.setData(key, id);
          });
          break;
        case 'TABLE':
          var opt = app.templates[id] ? app.templates[id] : 0;
          var config = app.config && app.config[id] ? app.config[id] : {};
          app.el[id].innerHTML = self.table(app.data[id], opt, config);
          break;
        case 'TBODY':
          if (!app.templates[id]) {
            if (app.data[id]) {
              app.templates[id] = '<tr data-index="{{index}}" data-id="{{this.id}}">';
              Object.entries(app.data[id][0]).forEach(function([k, o]) {
                app.templates[id] += '<td>{{this.' + k + '}}</td>';
              });
              app.templates[id] += '</tr>';
            } else {
              app.templates[id] = '<tr data-index="{{index}}" data-id="{{this.id}}"><td>{{this.name}}</td></tr>';
            }
          }
          if (app.data[id]) {
            self.render(key, id);
          } else {
            app.data[id] = [];
          }
          break;
        case 'MULTIPLE':
          if (!app.templates[id]) app.templates[id] = "<option value='{{this.id}}'>{{this.text}}</option>";
          if (app.data[id]) {
            app.el[id].innerHTML = self.render(key, id);
          } else {
            app.data[id] = [];
            app.el[id].querySelectorAll('option').forEach(function(li) {
              app.data[id].push({
                id: li.value,
                text: li.innerHTML
              });
            });
          }
          if (app.values[id]) {
            var ids = [];
            app.values[id].forEach(function(obje) {
              ids.push(obje.id);
            });
            if (ids.length) app.el[id].value = ids;
          }
          app.el[id].addEventListener('change', function(e) {
            self.setData(key, id);
          });
          break;
        default:
          if (!app.templates[id]) app.templates[id] = '{{value}}';
          if (!app.data[id]) app.data[id] = o.innerHTML;
          self.render(key, id);
      }
    });
    
    document.querySelector(app.root).querySelectorAll("[app]").forEach(function(o) {
      o.querySelectorAll("[children]").forEach(function(children) {
        children.setAttribute("bind", children.getAttribute("children"));
        children.removeAttribute("children");
      });
    });
    document.querySelector(app.root).querySelectorAll("[app]").forEach(function(o) {
      self.initApp(o.getAttribute("app"));
    });
  },
  mirror:function(key){
  	var app = this.apps[key];
  	var objs = document.querySelectorAll(app.root);
    if(objs.length>1) {
    	var x = 0;
    	var h ="";
    	objs.forEach(function(o) {
    		if(!x) {
    			h=o.innerHTML;
    		} else {
    			o.innerHTML = h;
    		}
    		x++;
    	});
    }
  },
  render: function(key, id) {
    if (!this.apps[key]) {
      alert('App "' + key + '" does not exist');
      return;
    }

    if (!id) return this.loadApps([key]);
    var self = this;
    var app = this.apps[key];

    var tag = app.tag[id];
    var val = app.data[id];
    if (app.filters[id]) val = app.filters[id](val);
    var h = '';

    if (!val) val = '';
    if (Array.isArray(val)) {
      if (!app.templates[id]) {
        h = JSON.stringify(val);
      } else {
        val.forEach(function(li, n) {
          var s = self.cleanString(app.templates[id]);
          s = s.split("{{index}}").join(n);
          s = s.split("{{value}}").join(li);
          s = s.split("{{this").join('{{' + key + '.data.' + id + '[' + n + ']');
          s = self.tempString(s, key, li, id, n);
          h += s;
        });
      }
    } else if (typeof val === 'object') {

      if (!app.templates[id]) {
        h = JSON.stringify(val);
      } else {
        var s = self.cleanString(app.templates[id]);
        s = s.split("{{this").join('{{' + key + '.data.' + id);
        s = s.split("{{value").join('{{' + key + '.data.' + id);
        s = self.tempString(s, key, app.data[id], id);
        h += s;
      }
    } else {
      var str = val;
      if (app.templates[id]) {
        var s = self.cleanString(app.templates[id]);
        s = s.split("{{this").join('{{' + key + '.data');
        s = s.split("{{value").join('{{' + key + '.data.' + id);
        s = self.tempString(s, key, app.data[id], id);
        h += s;
      } else {
        h = str;
      }
    }

    document.querySelector(app.root).querySelector("[bind='" + id + "']").innerHTML = h;
	this.mirror(key);
    return h;
  },
  rendTemplate: function(key) {

    if (!this.apps[key].template || this.apps[key].template == "" || this.apps[key].template.indexOf('{{') == -1) return this.apps[key].template;
    var template = document.createElement('div');
    template.innerHTML = this.apps[key].template;
    var keys = {};
    // Temporarily Remove children
    template.querySelectorAll("[bind]").forEach(function(item) {
      var id = Math.random().toString(36).substring(4);
      item.after(id);
      item.remove();
      keys[id] = item.outerHTML;
    });

    var s = template.innerHTML.toString();

    s = s.split("this.").join(key + '.data.');
    s = this.tempString(s, key);
    Object.entries(keys).forEach(function([k, h]) {
      s = s.replace(k, h);
    });
    return s;
  },
  cleanString: function(s) {
    s = s.toString();
    s = s.replace(/{{(.*?)}}/gi, function(x) {
      x = x.replace(/ /g, '');
      return x;
    });
    return s;
  },
  tempString: function(s, key, obj, id, n) {
    var self = this;
    return s.replace(
      /\{\{[^\}]*\}\}/g,
      function(val, index) {
        return self.tempValue(val, key, obj, id, n);
      });
  },
  tempValue: function(s, key, obj, id, n) {
    var self = this;
    s = s.replace('{{', '').replace('}}', '').replace('()', '');
    fun = s.split("(");
    if (fun[1]) s = fun[0];
    s = s.split("||");
    var v = eval("this.apps." + s[0].trim());

    if (typeof v == 'function') {
      if (fun[1]) {

        fun[1] = fun[1].replace(')', '');
        var con = (typeof n != 'undefined') ? key + '.data.' + id + '[' + n + ']' : key + '.data.' + id;
        fun[1] = fun[1].split("this").join(con);
        var vl = eval("this.apps." + fun[1].trim());
        v = v(vl);
      } else {
        v = (typeof n != 'undefined') ? v(n, obj) : v(obj);
      }
    }
    if (s[1] && v == undefined) v = s[1].trim();
    if (this.apps[key].filters[id]) v = this.apps[key].filters[id](v);

    if (typeof v === 'object' && v && v.text) v = v.text;
    if (typeof v === 'object' && v && v[0] && v[0].text) v = v.map(function(u) {
      return u.text;
    }).join(', ');
    return (typeof v != 'undefined') ? v : '';
  },
  setData: function(key, id) {
    var self = this;
    var app = this.apps[key];
    var tag = app.tag[id];
    var el = app.el[id];

    switch (tag) {
      case 'RADIO':
        app.values[id] = {
          id: el.querySelector('input:checked').value,
          text: el.querySelector('input[value="' + el.value + '"]').innerHTML
        };
        break;
      case 'CHECKBOX':
        var v = el.checked ? 1 : 0;
        app.data[id] = app.values[id] = {
          id: v,
          text: el.parentNode.innerHTML
        };
        break;
      case 'INPUT':
        app.values[id] = app.data[id] = el.value;
        break;
      case 'TEXTAREA':
        app.values[id] = app.data[id] = el.value;
        break;
      case 'SELECT':
        app.values[id] = {
          id: el.value,
          text: el.options[el.selectedIndex].text
        };
        break;
      case 'MULTIPLE':
        app.values[id] = [];
        var vals = el.value;
        Array.from(vals).forEach(function(obje) {
          app.values[id].push({
            id: obje,
            text: el.querySelector('option[value="' + obje + '"]').innerHTML
          });
        });
        break;
      default:
        app.data[id] = el.innerHTML;
    }
    if (app.change[id]) app.change[id](app.data[id], id, key);
  },
  setHTML: function(key, id) {
    var self = this;
    var app = this.apps[key];
    var val = app.data[id];
    var tag = app.tag[id];
    var el = app.el[id];

    switch (tag) {
      case 'UL':
        el.innerHTML = self.render(key, id);
        break;
      case 'RADIO':
        if (app.values[id]) el.querySelector('input[name="' + id + '"][value="' + app.values[id].id + '"]').checked = true;
        break;
      case 'CHECKBOX':
        el.checked = val ? true : false;
        break;
      case 'INPUT':
        el.value = val;
        break;
      case 'TEXTAREA':
        el.value = val;
        break;
      case 'SELECT':
     	if (!app.values[id] && app.data[id][0].id!="") app.values[id] = app.data[id][0];
        if (app.values[id]) el.value = app.values[id].id;
        break;
      case 'MULTIPLE':
        if (app.values[id]) {
          var ids = [];
          Array.from(app.values[id]).forEach(function(obje) {
            ids.push(obje.id);
          });
          if (ids.length) el.value = ids;
        }
        break;
    	case 'TABLE':
          var opt = app.templates[id] ? app.templates[id] : 0;
          var config = app.config && app.config[id] ? app.config[id] : {};
          app.el[id].innerHTML = self.table(app.data[id], opt, config);
          break;
        case 'TBODY':
          
          break;
      default:
        el.innerHTML = val;
    }
    if (app.change[id]) app.change[id](app.data[id]);
    this.mirror(key);
  },
  set: function(key, id, val, value) {
    if (val == '') val = null;

    var app = this.apps[key];

    if (value) {
    	this._set(id, value, app.values)
    } else {
    	this._set(id, val, app.data);
    	if(app.values[id]) delete app.values[id];
    };

    if (id.indexOf('.') > -1) id = id.split('.')[0];
    if (app.change[id]) app.change[id](val, id, key);

    if (app.templates[id] && !value) {
      this.render(key, id);
      this.setHTML(key, id);
    } else {
      this.setHTML(key, id);
    }
  },
  load: function(o) {
    var self = this;
    Object.entries(o).forEach(function([k, v]) {
      self.set(k, v);
    });
  },
  setVar: function(id, key, val) {
    if (!val) return;
    var a = key.split('.');
    var c = a.length - 1;
    if (!this.va[id]) this.va[id] = {};
    var obj = this.va[id];
    a.forEach(function(o, n) {
      if (!obj[o]) obj[o] = {};
      if (n == c) obj[o] = val;
      obj = obj[o];
    });
  },
  push: function(key, id, val, index) {
    if (val == '') val = null;
    var app = this.apps[key];
    if (typeof index !== 'undefined') app.data[id].splice(index, 0, val);
    else app.data[id].push(val);
    if (app.change[id]) app.change[id](app.data[id], id, key);
    if (app.templates[id]) {
      this.render(key, id);
    } else {
      this.setHTML(key, id);
    }
  },
  pop: function(key, id, index) {
    var app = this.apps[key];
    if (typeof index !== 'undefined') app.data[id].splice(index, 1);
    else app.data[id].pop();
    if (app.change[id]) app.change[id](app.data[id], id, key);
    if (app.templates[id]) {
      this.render(key, id);
    } else {
      this.setHTML(key, id);
    }
  },
  getVals: function(ids) {
    var self = this;
    var o = {};
    Array.from(ids).forEach(function(id) {
      o[id] = self.data[id];
    });
    return o;
  },
  print: function(o) {
    if (!o) return alert(JSON.stringify(this.data, null, 2));
    alert(JSON.stringify(o, null, 2));
  },
  log: function(s) {
    window.console.log(s);
  },
  href: function(u) {
    window.location.href = u;
  },
  link: function(path) {
    if (window.event.metaKey || window.event.ctrlKey) {
      window.open(path, '_blank');
    } else {
      window.history.pushState(path, path, path);
      this.setPath(path);
    }
  },
  setRouter: function() {
    var self = this;
    if (this.routeHash) {
      window.addEventListener('hashchange', function() {
        self.setPath();
      });
    } else {
      window.onpopstate = function(e) {
        self.setPath(e.state);
      };
    }
    this.setGetVars();
    this.setPath(0, 1);
  },
  setPath: function(path, noRoute) {
    if (this.routeHash) {
      this.path = location.hash.substr(2);
      this.url = this.path.split('/');
    } else {
      this.path = path ? path.substr(1) : window.location.pathname.substr(1);
      this.url = this.path.split('/');
    }
    if (!noRoute) this.routing();
  },
  setGetVars: function() {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    pax.getVars = {};
    vars.forEach(function(pair) {
      var parts = pair.split('=');
      pax.getVars[parts[0]] = parts[1];
    });
  },
  routing: function() {
    var route = '/error';
    var route2 = 0;
    var _path = '';
    var _path2 = '';
    var self = this;

    for (var i = 0, total = this.url.length; i < total; i++) {
      _path += (i ? '/' + this.url[i] : this.url[i]);
      _path2 += (i ? '_' + this.url[i] : this.url[i]);
      if (this.routes['/' + _path]) route = '/' + _path;
      if (this.routeTags[_path2]) route2 = _path2;
    }

    if (this.routes[route]) {
      if (this.routeInit) this.routeInit();
      var key = this.routes[route];
      document.querySelector(this.apps[key].root).innerHTML = self.loadTemplate;
      this.activeRoute = this.routes[route];
      this.loadApps([key]);
      if (this.routeReady) this.routeReady();
      Object.entries(this.apps).forEach(function([k, o]) {
        if (o.appReady) o.appReady();
      });
    }
  },
  parse: function(text) {
    if (typeof text !== 'string') return text;
    try {
      var j = JSON.parse(text);
      return j;
    } catch (error) {
      return { error: 1, message: 'Server Error' };
    }
  },
  ajax: function(path, query, func) {
    var self = this;
    if (!query) {
      fetch(path)
        .then(function(response) {
          return response.text();
        })
        .then(function(e) {
          if (func) func(self.parse(e));
          if (self.el.progress) self.el.progress.style.display = 'none';
        })
        .catch(function(e) {
          if (func) func({ error: true, xhr: e });
          if (self.el.progress) self.el.progress.style.display = 'none';
        });
    } else {
      fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: query
        })
        .then(function(response) {
          return response.text();
        })
        .then(function(e) {
          if (self.el.progress) self.el.progress.style.display = 'none';
          if (func) func(self.parse(e));
        })
        .catch(function(e) {
          if (self.el.progress) self.el.progress.style.display = 'none';
          if (func) func({ error: true, xhr: e });
        });
    }
  },
  _get: function(str, obj) {
    if (!str) return '';
    str = str.split('[').join('.').split(']').join('').replace('()', '');
    obj = obj ? obj : window;

    if (str.indexOf('.') < 0) {
      var val = obj[str] !== undefined ? obj[str] : '';
      if (typeof val === 'object' && val && val.text) val = val.text;
      if (typeof val === 'object' && val[0] && val[0].text) val = val.map(function(u) {
        return u.text;
      }).join(', ');
    } else {
      var val = str.split('.').reduce(function(o, v) {
        return o ? o[v] : '';
      }, obj);
      if (typeof val === 'object' && val.text) val = val.text;
      if (typeof val === 'object' && val && val[0] && val[0].text) val = val.map(function(u) {
        return u.text;
      }).join(', ');
    }
    return val;
  },
  _set: function(path, value, obj, first) {
    if (!path) return '';
    obj = obj ? obj : window;
    if (path.indexOf('.') > -1) path = path.split('.');
    if (Array.isArray(path) && path.length > 1) {
      if (!obj.hasOwnProperty(path[0]) || typeof obj[path[0]] !== 'object') {
        obj[path[0]] = Number.isInteger(parseInt(path[1])) ? [] : {};
      }
      if (path[0] === '*') {
        var self = this;
        Object.entries(obj).forEach(function([i, o]) {
          first = first ? first : o;
          self._set(path.slice(1), value, o, first);
        });
      } else {
        first = first ? first : obj[path[0]];
        return this._set(path.slice(1), value, obj[path[0]], first);
      }
    } else {
      obj[path] = value;
      return first;
    }
  },
  clone: function(obj) {
    var o = JSON.parse(JSON.stringify(obj));
    Object.entries(obj).forEach(function([k, v]) {
      if (typeof v === 'function') o[k] = v;
    });
    return o;
  },
  table: function(obj, vars, config, key, tbody) {
    var self = this;
    if (!key) key = 'id';
    if (!obj.length) return "<table><tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody></table>";
    var h = '<table><thead><tr>';
    var body = '<tbody>';
    if (!vars) {
      var keys = [];
      Object.entries(obj[0]).forEach(function([k, o]) {
        h += '<th>' + k.split('_').join(' ') + '</th>';
        keys.push(k);
      });
      h += '</tr></thead>';
      obj.forEach(function(o, i) {
        body += o[key] ? "<tr data-id='" + o[key] + "' data-index='" + i + "'>" : "<tr data-id='" + i + "' data-index='" + i + "'>";
        keys.forEach(function(k) {
          var v = o[k];
          if (typeof v === 'object' && v.text) v = v.text;
          if (typeof v === 'object' && v[0] && v[0].text) v = v.map(function(u) {
            return u.text;
          }).join(', ');
          body += v != null ? '<td>' + v + '</td>' : '<td></td>';
        });
        body += '</tr>';
      });
    } else {
      vars.forEach(function(o) {
        h += o.thead ? '<th>' + o.thead + '</th>' : '<th>' + o.id.split('_').join(' ') + '</th>';
      });
      h += '</tr></thead>';
      obj.forEach(function(o, i) {
        var cl = config.cl ? 'onclick="' + config.cl + '(this)"' : '';
        body += o[key] ? "<tr data-id='" + o[key] + "' data-index='" + i + "' " + cl + '>' : "<tr data-id='" + i + "' data-index='" + i + "' " + cl + '>';
        vars.forEach(function(k) {
          var val = self._get(k.id, o);
          if (k.filter) val = k.filter(val, o);
          body += val != null ? '<td>' + val + '</td>' : '<td></td>';
        });
        body += '</tr>';
      });
    }
    return tbody ? body + '</tbody>' : h + body + '</tbody></table>';
  }
};
var pax = new $pax();
var app = pax.apps;
window.addEventListener('DOMContentLoaded', function() {
  pax.init();
});