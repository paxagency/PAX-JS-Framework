var $pax = function(o) {};
$pax.prototype = {
  url:[],
  urlTail:[],
  routes:{},
  routeHash:0,
  apps:{},
  instances:{},
  _instId:0,
  routeFade:1,
  routeMove:1,
  el:{routes:'#routes'},
  config:{debug:false},
  version:'1.0.04',
  _initialized:false,
  _known:['data','templates','template','change','load','filters','values','str','el','tag','config','root','url','depends','init','ready','loaded','destroy','shared'],
  _hints:{temlpates:'templates',tempalte:'template',redy:'ready',lod:'load',chnage:'change',templete:'template',global:'depends'},
  _warn:function(msg){
    if(this.config.debug) console.warn('[PAX]',msg);
  },
  _esc:function(s){
    if(s==null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },
  _resolve:function(path){
    if(!path || !/^[\w.\[\]]+$/.test(path)){
      if(this.config.debug) this._warn('Invalid template path: '+path);
      return undefined;
    }
    var parts = path.replace(/\[/g,'.').replace(/\]/g,'').split('.').filter(Boolean);
    var cur = this.apps;
    for(var i=0;i<parts.length;i++){
      if(cur==null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  },
  _out:function(v,html){
    if(v==null) return '';
    v = String(v);
    return html ? v : this._esc(v);
  },
  _isTruthy:function(v){
    if(v==null || v===false) return false;
    if(v===0 || v==='0' || v==='') return false;
    if(Array.isArray(v)) return v.length>0;
    return true;
  },
  _evalValue:function(key,expr,ctx){
    var self = this;
    expr = String(expr||'').trim();
    if(!expr) return '';
    var paren = expr.indexOf('(');
    if(paren>-1 && expr.slice(-1)===')'){
      var fnName = expr.slice(0,paren).trim();
      var fn = self._resolve(key+'.'+fnName);
      if(typeof fn==='function'){
        return fn.call(self.apps[key], ctx&&ctx.index, ctx&&ctx.item);
      }
    }
    if(expr.indexOf('this.')===0){
      if(ctx && ctx.item) return self._get(expr.slice(5), ctx.item);
      return self._get(expr.slice(5), self.apps[key].data);
    }
    if(ctx && ctx.item && expr.indexOf('.')<0) return ctx.item[expr];
    return self._get(expr, self.apps[key].data);
  },
  _evalExpr:function(key,expr,ctx){
    expr = String(expr||'').trim();
    if(!expr) return false;
    var negate = expr.charAt(0)==='!';
    if(negate) expr = expr.slice(1).trim();
    var truthy = this._isTruthy(this._evalValue(key, expr, ctx));
    return negate ? !truthy : truthy;
  },
  _directiveCtx:function(key,el,app){
    var row = el.closest ? el.closest('[data-index]') : null;
    if(!row || !row.parentElement) return null;
    var bindId = null;
    Object.keys(app.el).forEach(function(id){
      if(app.el[id]===row.parentElement) bindId = id;
    });
    if(!bindId || !Array.isArray(app.data[bindId])) return null;
    var index = parseInt(row.getAttribute('data-index'), 10);
    return { id: bindId, index: index, item: app.data[bindId][index] };
  },
  _syncVisibility:function(el,visible){
    if(!el.hasAttribute('data-pax-display')){
      var d = el.style.display;
      if(!d || d==='none') d = (el.tagName==='SPAN' || el.tagName==='A' || el.tagName==='LABEL') ? 'inline' : 'block';
      el.setAttribute('data-pax-display', d);
    }
    el.style.display = visible ? el.getAttribute('data-pax-display') : 'none';
  },
  _applyAttr:function(el,name,val){
    if(name==='checked' || name==='disabled' || name==='selected' || name==='readonly'){
      el[name] = this._isTruthy(val);
      return;
    }
    if(val==null || val===false || val==='') el.removeAttribute(name);
    else el.setAttribute(name, val);
  },
  _syncDirectives:function(key,root){
    if(!root || !this.apps[key]) return;
    var self = this;
    var app = this.apps[key];
    var nodes = [root];
    if(root.querySelectorAll) nodes = nodes.concat(Array.from(root.querySelectorAll('*')));
    nodes.forEach(function(el){
      if(!el.getAttribute) return;
      var ctx = self._directiveCtx(key, el, app);
      if(el.hasAttribute('show')) self._syncVisibility(el, self._evalExpr(key, el.getAttribute('show'), ctx));
      if(el.hasAttribute('hide')) self._syncVisibility(el, !self._evalExpr(key, el.getAttribute('hide'), ctx));
      Array.from(el.attributes || []).forEach(function(attr){
        if(attr.name.indexOf('attr:')!==0) return;
        var prop = attr.name.slice(5);
        var val = self._evalValue(key, attr.value, ctx);
        self._applyAttr(el, prop, val);
      });
    });
  },
  _wireHandlers:function(root){
    if(!root || !root.getAttribute) return;
    var self = this;
    var nodes = [root];
    if(root.querySelectorAll) nodes = nodes.concat(Array.from(root.querySelectorAll('*')));
    nodes.forEach(function(el){
      Array.from(el.attributes || []).forEach(function(attr){
        if(!/^on[a-z]+$/i.test(attr.name)) return;
        var type = attr.name.slice(2);
        var expr = attr.value;
        el.removeAttribute(attr.name);
        el.addEventListener(type, function(event){
          self._runHandler(expr, event);
        });
      });
    });
  },
  _runHandler:function(expr, event){
    var paxRef = this._handlerView(event);
    var app = this.apps;
    try {
      var fn = new Function('pax','app','event', expr);
      fn.call(event.currentTarget, paxRef, app, event);
    } catch(e){
      if(this.config.debug) this._warn('Handler: '+expr+' — '+e.message);
    }
  },
  _handlerView:function(event){
    var self = this;
    var base = this._view();
    return new Proxy(base, {
      get: function(t, prop){
        if(typeof prop === 'symbol') return t[prop];
        if(prop in t){
          var val = t[prop];
          return typeof val === 'function' ? val.bind(t) : val;
        }
        var def = t.apps[prop];
        if(def && def.shared === false && event){
          var inst = self._instanceFromEvent(prop, event);
          if(inst) return inst;
        }
        if(def && def.shared === false) return self._firstInstance(prop) || def;
        return t.apps[prop];
      }
    });
  },
  _instanceFromEvent:function(name, event){
    if(!event || !event.currentTarget) return this._firstInstance(name);
    var node = event.currentTarget.closest('[data-pax-inst]');
    if(node){
      var id = node.getAttribute('data-pax-inst');
      if(id && this.apps[id]) return this.apps[id];
    }
    return this._firstInstance(name);
  },
  _firstInstance:function(name){
    var ids = this.instances[name];
    return ids && ids[0] ? this.apps[ids[0]] : null;
  },
  _rootEl:function(app){
    if(!app || !app.root) return null;
    if(app.root.nodeType === 1) return app.root;
    return document.querySelector(app.root);
  },
  _rootAll:function(app){
    if(!app || !app.root) return [];
    if(app.root.nodeType === 1) return [app.root];
    return Array.from(document.querySelectorAll(app.root));
  },
  _cloneInst:function(def){
    var o = { data:{}, templates:{}, change:{}, values:{}, el:{}, tag:{}, filters:{}, str:{} };
    if(def.data) o.data = JSON.parse(JSON.stringify(def.data));
    if(def.templates) o.templates = Object.assign({}, def.templates);
    if(def.template) o.template = def.template;
    if(def.config) o.config = JSON.parse(JSON.stringify(def.config));
    if(def.change) o.change = Object.assign({}, def.change);
    Object.keys(def).forEach(function(k){
      if(typeof def[k] === 'function') o[k] = def[k];
    });
    return o;
  },
  _createInstance:function(name, el){
    var def = this.apps[name];
    if(!def || el.getAttribute('data-pax-init')) return;
    var id = name + '~' + (++this._instId);
    el.setAttribute('data-pax-inst', id);
    el.setAttribute('data-pax-init', '1');
    var inst = this._cloneInst(def);
    inst._parent = name;
    inst.shared = false;
    inst.root = el;
    this.apps[id] = inst;
    if(!this.instances[name]) this.instances[name] = [];
    this.instances[name].push(id);
    this.setDefaults(inst);
    this._bindApp(id);
    this.initApp(id);
  },
  _view:function(){
    var self = this;
    if(!this._viewProxy){
      this._viewProxy = new Proxy(this, {
        get: function(t, prop){
          if(typeof prop === 'symbol') return t[prop];
          if(prop in t){
            var val = t[prop];
            return typeof val === 'function' ? val.bind(t) : val;
          }
          if(t.apps[prop] && t.apps[prop].shared === false)
            return t._firstInstance(prop) || t.apps[prop];
          return t.apps[prop];
        }
      });
    }
    return this._viewProxy;
  },
  register:function(name,def){
    if(!def) def = {};
    if(!this.apps[name]){
      this.apps[name] = def;
    } else {
      this._mergeApp(this.apps[name],def);
    }
    this.setDefaults(this.apps[name]);
    this._bindApp(name);
    this._checkDef(name, def);
    if(this._initialized && def.shared !== false) this._startWhenReady(name);
    return this.apps[name];
  },
  app: function(name, def) {
    return this.register(name, def);
  },
  _checkDef:function(name,def){
    if(!this.config.debug || !def) return;
    var self = this;
    Object.keys(def).forEach(function(k){
      if(self._hints[k]) self._warn('App "'+name+'": "'+k+'" — did you mean "'+self._hints[k]+'"?');
      else if(self._known.indexOf(k)>-1) return;
      else if(typeof def[k]==='function') return;
    });
  },
  _checkApps:function(){
    if(!this.config.debug) return;
    var self = this;
    document.querySelectorAll('[app]').forEach(function(el){
      var key = el.getAttribute('app');
      if(key && !self.apps[key]) self._warn('[app="'+key+'"] in HTML but not registered');
    });
    Object.keys(this.apps).forEach(function(k){
      var o = self.apps[k];
      if(!o.url && !o.root && !document.querySelector('[app="'+k+'"]'))
        self._warn('App "'+k+'" registered but no [app="'+k+'"] or url');
    });
  },
  _finishInit:function(){
    this._checkApps();
    var self = this;
    document.querySelectorAll('[app]').forEach(function(el){
      var name = el.getAttribute('app');
      if(self.apps[name] && self.apps[name].shared === false) self._createInstance(name, el);
    });
    Object.entries(this.apps).forEach(function(entry){
      if(entry[0].indexOf('~')<0 && entry[1].shared !== false) self.mirror(entry[0]);
    });
    this._initialized = true;
  },
  _bindApp:function(key){
    var self = this;
    var app = this.apps[key];
    if(!app) return;
    app.set = function(id,val,mode){self.set(key,id,val,mode);};
    app.push = function(id,val,index){self.push(key,id,val,index);};
    app.pop = function(id,val){self.pop(key,id,val);};
    app.render = function(){self.renderChildren(key);};
  },
  _mergeApp:function(target,def){
    var merge = ['data','templates','change','load','filters','values','str','el','tag'];
    Object.entries(def).forEach(function(entry){
      var k = entry[0], v = entry[1];
      if(typeof v==='undefined') return;
      if(merge.indexOf(k)>-1 && v && typeof v==='object' && !Array.isArray(v)){
        if(!target[k]) target[k] = {};
        Object.assign(target[k],v);
      } else {
        target[k] = v;
      }
    });
  },
  get:function(name, ref){
    if(ref != null){
      if(typeof ref === 'number'){
        var ids = this.instances[name];
        return ids && this.apps[ids[ref]] ? this.apps[ids[ref]] : null;
      }
      if(ref.nodeType){
        var id = ref.getAttribute('data-pax-inst');
        return id ? this.apps[id] : null;
      }
    }
    if(this.apps[name] && this.apps[name].shared === false)
      return this._firstInstance(name) || this.apps[name];
    if(!this.apps[name] && this.config.debug) this._warn('App "'+name+'" not found');
    return this.apps[name];
  },
  loadTemplate:`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position:absolute; left:50%; top:50%;max-width:50px; margin-left:-25px;margin-top:-125px; display: block; shape-rendering: auto;" width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" cy="50" fill="none" stroke="blue" stroke-width="4" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
    <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform></circle></svg>`,
  init:function(o){
    var self = this;
    document.querySelectorAll('[app]').forEach(function(element){
      var key = element.getAttribute('app');
      if(key && !self.apps[key]) self.apps[key] = {};
    });
    //Set templates
    document.querySelectorAll('template').forEach(function(element){
      var key = element.getAttribute('app');
      var template = element.innerHTML;

      if(typeof key !== 'undefined') {
        var url = key.split('_').join('/');
        key = key.split('-').join('_');
        if(url=="index") url = "";
        if(!self.apps[key]) self.apps[key] = {};
        var add = {};
        if(!self.apps[key].template) add.template = template;
        if(!self.apps[key].url) add.url = "/"+url;
        self._mergeApp(self.apps[key],add);
      }
    });
    //Set app defaults and routes
   
    Object.entries(this.apps).forEach(function([k, o]){
      self.setDefaults(o);
      if(o.url) {
        self.routes[o.url] = k;
        o.root = self.el.routes;
      }
    }); 
	
    this.setRouter();
    this._checkApps();

    var keys = self._bootKeys();
    if(Object.keys(self.routes).length === 0){
      self.loadApps(keys, function(){
        self._finishInit();
      });
    } else {
      self.loadApps(keys, function(){
        self.routing(function(){
          self._finishInit();
        });
      });
    }
  },
  _bootKeys: function() {
    var self = this;
    var keys = [];
    Object.keys(this.apps).forEach(function(k) {
      var o = self.apps[k];
      if (k.indexOf('~') >= 0 || o.shared === false || o.url) return;
      if (document.querySelector('[app="' + k + '"]') || (o.root && o.root !== self.el.routes)) keys.push(k);
    });
    return keys;
  },
  _startWhenReady: function(key, done, stack) {
    var self = this;
    stack = stack || [];
    if (stack.indexOf(key) >= 0) {
      if (this.config.debug) this._warn('Circular depends: ' + stack.concat(key).join(' → '));
      if (done) done();
      return;
    }
    var app = this.apps[key];
    if (!app) { if (done) done(); return; }
    if (app._booted) { if (done) done(); return; }
    if (!app._bootWait) app._bootWait = [];
    if (done) app._bootWait.push(done);
    if (app._booting) return;
    app._booting = true;

    var deps = app.depends || [];
    if (!deps.length) return this._loadOne(key);

    var pending = deps.length;
    var nextStack = stack.concat(key);
    deps.forEach(function(dep) {
      if (!self.apps[dep] && self.config.debug) self._warn('App "' + key + '" depends on "' + dep + '" which is not registered');
      self._startWhenReady(dep, function() {
        if (--pending === 0) self._loadOne(key);
      }, nextStack);
    });
  },
  _loadOne: function(key) {
    var self = this;
    var app = this.apps[key];
    if (!app) return this._bootDone(key);

    if (app.init) app.init.call(app);

    var pending = 0;
    if (app.load) {
      Object.entries(app.load).forEach(function(entry) {
        var k = entry[0], o = entry[1];
        if (!o || !o.url) {
          if (o && self.config.debug) self._warn('App "' + key + '" load "' + k + '" has no url — skipped');
          return;
        }
        pending++;
        var query = o.query ? o.query : 0;
        self.ajax(o.url, query, function(e) {
          if (e && e.error) {
            if (o.error) o.error.call(app, e);
            else if (self.config.debug) self._warn('App "' + key + '" load "' + k + '" failed');
          } else {
            self.setLoad(key, k, e);
          }
          pending--;
          if (!pending) {
            self.initApp(key);
            self._bootDone(key);
          }
        });
      });
    }

    if (!pending) {
      self.initApp(key);
      self._bootDone(key);
    }
  },
  _bootDone: function(key) {
    var app = this.apps[key];
    if (!app) return;
    app._booted = true;
    app._booting = false;
    var wait = app._bootWait || [];
    app._bootWait = [];
    wait.forEach(function(fn) { fn(); });
  },
  setDefaults:function(o){
    if(typeof o.shared === 'undefined') o.shared = true;
    o.root = (o.root) ? o.root : 0;
    o.el = (o.el) ? o.el : {};
    o.tag = (o.tag) ? o.tag : {};
    o.data = (o.data) ? o.data : {};
    o.values = (o.values) ? o.values : {};
    o.str = (o.str) ? o.str : {};
    o.templates = (o.templates) ? o.templates : {};
    o.filters = (o.filters) ? o.filters : {};
    o.change = (o.change) ? o.change : {};
    if (!o.depends) o.depends = [];
    else if (!Array.isArray(o.depends)) o.depends = [o.depends];
    return o;
  },
  loadApps:function(array, fun){
    var self = this;
    if (!array.length) { if (fun) fun(); return; }
    var remaining = array.length;
    array.forEach(function(key) {
      self._startWhenReady(key, function() {
        remaining--;
        if (!remaining && fun) fun();
      });
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
    var obj = this.apps;
    exp.forEach(function(k){
      obj = obj[k];
    });
    return (v) ? obj(v) : obj(0);
  },
  initApp:function(key) {
    var self =this;
    var app = this.apps[key];
    if(!app) return;
    if(app.shared === false && key.indexOf('~')<0) return;
    this._bindApp(key);
 
    if(!app.root && key.indexOf('~')<0 && document.querySelector('[app="'+key+'"]')) app.root = '[app="'+key+'"]';
    if(app.loaded) app.loaded.call(app);
    if(app.root) this.renderApp(key);
    if(app.ready) app.ready.call(app);
  },
  renderApp:function(key){
    var self = this;
    var app = this.apps[key];
    var roots = this._rootAll(app);
    if(!app.template && roots[0]) app.template = roots[0].innerHTML;
   
    roots.forEach(function(o) {
      o.innerHTML = self.rendTemplate(key); 
    });
    
    this.renderChildren(key);
    if(app.root==self.el.routes){
      var routeEl = this._rootEl(app);
      if(routeEl && self.routeFade) {
        routeEl.setAttribute("style","transition:none;opacity:0;");
        setTimeout(function(){routeEl.setAttribute("style","opacity:1; transition: opacity .3s;");},10);
      }
      if(self.routeMove) window.scrollTo({top: 0, behavior: 'smooth'});
    }
  },
  _hasBindData: function(app, id) {
    return Object.prototype.hasOwnProperty.call(app.data, id);
  },
  _headKey: function(text) {
    return String(text).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  },
  _tableKeys: function(table) {
    var self = this;
    var keys = [];
    if (!table) return keys;
    table.querySelectorAll('thead th').forEach(function(th) {
      keys.push(self._headKey(th.textContent));
    });
    return keys;
  },
  _scrapeTable: function(el) {
    var table = el.tagName === 'TABLE' ? el : el.closest('table');
    if (!table) return [];
    var keys = this._tableKeys(table);
    var tbody = el.tagName === 'TBODY' ? el : table.querySelector('tbody');
    if (!tbody || !keys.length) return [];
    var rows = [];
    tbody.querySelectorAll('tr').forEach(function(tr) {
      if (tr.innerHTML.indexOf('{{') >= 0) return;
      var row = {};
      tr.querySelectorAll('td').forEach(function(td, i) {
        if (keys[i]) row[keys[i]] = td.textContent.trim();
      });
      if (Object.keys(row).length) rows.push(row);
    });
    return rows;
  },
  _tbodyTemplate: function(keys) {
    if (!keys.length) return '<tr data-index="{{index}}"><td>{{this.name}}</td></tr>';
    var h = '<tr data-index="{{index}}">';
    keys.forEach(function(k) { h += '<td>{{this.' + k + '}}</td>'; });
    return h + '</tr>';
  },
  _tagType: function(el) {
    var tag = el.tagName;
    if (tag === 'SELECT' && el.hasAttribute('multiple')) return 'MULTIPLE';
    if (tag === 'INPUT') {
      var type = el.getAttribute('type');
      if (type === 'checkbox') return 'CHECKBOX';
      if (type === 'radio') return 'IGNORE';
      if (type === 'button' || type === 'submit') return 'BUTTON';
    }
    if (el.getAttribute('bind-type')) return el.getAttribute('bind-type').toUpperCase();
    return tag;
  },
  _bindList: function(key, id, el, opts) {
    var self = this;
    var app = this.apps[key];
    if (opts.setTemplate) opts.setTemplate(app, id, el);
    else if (!app.templates[id] && opts.template) app.templates[id] = opts.template;
    if (self._hasBindData(app, id)) self.render(key, id);
    else app.data[id] = opts.scrape ? opts.scrape(el) : [];
  },
  _bindOptions: function(key, id, el, multi) {
    var self = this;
    var app = this.apps[key];
    if (!app.templates[id]) app.templates[id] = "<option value='{{this.id}}'>{{this.text}}</option>";
    if (self._hasBindData(app, id)) app.el[id].innerHTML = self.render(key, id);
    else {
      app.data[id] = [];
      el.querySelectorAll('option').forEach(function(opt) {
        app.data[id].push({ id: opt.value, text: opt.innerHTML });
      });
    }
    if (multi) {
      if (app.values[id]) {
        var ids = [];
        app.values[id].forEach(function(obj) { ids.push(obj.id); });
        if (ids.length) app.el[id].value = ids;
      }
    } else {
      if (app.values[id]) app.el[id].value = app.values[id].id;
      if (!app.values[id] && app.data[id][0] && app.data[id][0].id != "") app.values[id] = app.data[id][0];
    }
    app.el[id].addEventListener('change', function() { self.setData(key, id); });
  },
  _prepTemplate: function(template, key, id, n, ctx) {
    var s = this.cleanString(template);
    if (typeof n !== 'undefined') {
      s = s.split("{{index}}").join(n);
      s = s.split("{{value}}").join(typeof ctx === 'string' ? this._esc(ctx) : ctx);
      s = s.split("{{this").join('{{' + key + '.data.' + id + '[' + n + ']');
    } else if (typeof ctx === 'object' && ctx !== null) {
      s = s.split("{{this").join('{{' + key + '.data.' + id);
      s = s.split("{{value").join('{{' + key + '.data.' + id);
    } else {
      s = s.split("{{this").join('{{' + key + '.data');
      s = s.split("{{value").join('{{' + key + '.data.' + id);
    }
    return s;
  },
  renderChildren: function(key) {
    if (!key) {
      if(this.config.debug) this._warn('renderChildren called without app key');
      return;
    }

    var self = this;
    var app = this.apps[key];
    var root = this._rootEl(app);
    if(!root) return;
	
    
   
    root.querySelectorAll("[app]").forEach(function(o) {
       o.querySelectorAll("[bind]").forEach(function(children) {
        children.setAttribute("children", children.getAttribute("bind"));
        children.removeAttribute("bind");
      });
    });
    
    root.querySelectorAll("[bind]").forEach(function(o) {
      var tag = self._tagType(o);
      var id = o.getAttribute('bind');
	
      if (id == "") return false;
		
      app.el[id] = o;
      if (tag == 'TEMPLATE') return false;
      app.tag[id] = tag;
      var html = o.innerHTML;

      if (!app.templates[id] && html.indexOf('{{') >= 0) app.templates[id] = html;

      switch (tag) {
        case 'UL':
        case 'OL':
          self._bindList(key, id, o, {
            template: '<li data-index="{{index}}">{{value}}</li>',
            scrape: function(el) {
              var items = [];
              el.querySelectorAll('li').forEach(function(li) { items.push(li.innerHTML); });
              return items;
            }
          });
          break;
        case 'RADIO':
          if (!app.templates[id]) app.templates[id] = "<label><input type='radio' value='{{this.id}}' name='" + id + "'>{{this.text}}</label> ";
          if (self._hasBindData(app, id)) {
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
          if (self._hasBindData(app, id)) {
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
          if (self._hasBindData(app, id)) {
            o.value = app.data[id];
          } else {
            app.data[id] = o.value;
          }
          
          app.el[id].addEventListener('keyup', function(e) {
        
            self.setData(key, id);
          });
          break;
        case 'TEXTAREA':
          if (self._hasBindData(app, id)) {
            o.innerHTML = app.data[id];
          } else {
            app.data[id] = o.innerHTML;
          }
          app.el[id].addEventListener('focusout', function(e) {
            self.setData(key, id);
          });
          break;
        case 'SELECT':
          self._bindOptions(key, id, o, false);
          break;
        case 'TABLE':
          if (!self._hasBindData(app, id)) app.data[id] = self._scrapeTable(o);
          var opt = app.templates[id] ? app.templates[id] : 0;
          var config = app.config && app.config[id] ? app.config[id] : {};
          app.el[id].innerHTML = self.table(app.data[id] || [], opt, config);
          break;
        case 'TBODY':
          self._bindList(key, id, o, {
            setTemplate: function(app, id, el) {
              if (app.templates[id]) return;
              var keys = self._tableKeys(el.closest('table'));
              if (self._hasBindData(app, id) && app.data[id][0]) keys = Object.keys(app.data[id][0]);
              app.templates[id] = self._tbodyTemplate(keys);
            },
            scrape: function(el) { return self._scrapeTable(el); }
          });
          break;
        case 'MULTIPLE':
          self._bindOptions(key, id, o, true);
          break;
        default:
          if (!app.templates[id]) app.templates[id] = '{{value}}';
          if (!self._hasBindData(app, id)) app.data[id] = o.innerHTML;
          self.render(key, id);
      }
    });
    
    root.querySelectorAll("[app]").forEach(function(o) {
      o.querySelectorAll("[children]").forEach(function(children) {
        children.setAttribute("bind", children.getAttribute("children"));
        children.removeAttribute("children");
      });
    });
    root.querySelectorAll("[app]").forEach(function(o) {
      var child = o.getAttribute("app");
      var def = self.apps[child];
      if(def && def.shared === false) self._createInstance(child, o);
      else self.loadApps([child]);
    });
    self._wireHandlers(root);
    self._syncDirectives(key, root);
  },
  mirror:function(key){
  	var self = this;
  	var app = this.apps[key];
    if(!app || app.shared === false || key.indexOf('~')>-1) return;
  	var objs = (app.root) ? this._rootAll(app) : [];
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
    objs.forEach(function(o){ self._wireHandlers(o); self._syncDirectives(key, o); });
  },
  _listPatchable: function(key, id) {
    var app = this.apps[key];
    if (!app || !app.el[id] || !app.templates[id]) return false;
    var tag = app.tag[id];
    return (tag === 'UL' || tag === 'OL' || tag === 'TBODY') && Array.isArray(app.data[id]);
  },
  _renderListRow: function(key, id, n) {
    var app = this.apps[key];
    var arr = app.data[id];
    var tpl = app.templates[id];
    return this.tempString(this._prepTemplate(tpl, key, id, n, arr[n]), key, arr[n], id, n);
  },
  _rowFromHtml: function(html) {
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    return wrap.firstElementChild;
  },
  _insertListRow: function(el, index, html) {
    var row = this._rowFromHtml(html);
    if (!row) return null;
    var ref = el.children[index];
    if (ref) el.insertBefore(row, ref);
    else el.appendChild(row);
    return row;
  },
  _replaceListRow: function(el, index, html) {
    var row = this._rowFromHtml(html);
    if (!row) return null;
    var existing = el.children[index];
    if (existing) existing.replaceWith(row);
    else el.appendChild(row);
    return row;
  },
  _refreshListRowsFrom: function(key, id, fromIndex) {
    var self = this;
    var app = this.apps[key];
    var el = app.el[id];
    var arr = app.data[id];
    for (var i = fromIndex; i < arr.length; i++) {
      var row = self._replaceListRow(el, i, self._renderListRow(key, id, i));
      if (row) {
        self._wireHandlers(row);
        self._syncDirectives(key, row);
      }
    }
  },
  _patchPushList: function(key, id, index) {
    if (!this._listPatchable(key, id)) return false;
    var app = this.apps[key];
    var el = app.el[id];
    var arr = app.data[id];
    var insertAt = typeof index !== 'undefined' ? index : arr.length - 1;
    var row = this._insertListRow(el, insertAt, this._renderListRow(key, id, insertAt));
    if (!row) return false;
    this._wireHandlers(row);
    this._syncDirectives(key, row);
    if (insertAt < arr.length - 1) this._refreshListRowsFrom(key, id, insertAt + 1);
    this.mirror(key);
    return true;
  },
  _patchPopList: function(key, id, index) {
    if (!this._listPatchable(key, id)) return false;
    var app = this.apps[key];
    var el = app.el[id];
    var removeAt = typeof index !== 'undefined' ? index : app.data[id].length;
    var row = el.children[removeAt];
    if (!row) return false;
    row.remove();
    if (removeAt < app.data[id].length) this._refreshListRowsFrom(key, id, removeAt);
    this.mirror(key);
    return true;
  },
  render: function(key, id) {
    if (!this.apps[key]) {
      if (this.config.debug) this._warn('App "' + key + '" does not exist');
      return;
    }

    if (!id) return this.loadApps([key]);
    var self = this;
    var app = this.apps[key];
    var val = app.data[id];
    if (app.filters[id]) val = app.filters[id](val);
    if (!val) val = '';
    var tpl = app.templates[id];
    var h = '';

    if (Array.isArray(val)) {
      if (!tpl) h = JSON.stringify(val);
      else val.forEach(function(li, n) {
        h += self.tempString(self._prepTemplate(tpl, key, id, n, li), key, li, id, n);
      });
    } else if (typeof val === 'object') {
      if (!tpl) h = JSON.stringify(val);
      else h = self.tempString(self._prepTemplate(tpl, key, id, undefined, val), key, val, id);
    } else if (tpl) {
      h = self.tempString(self._prepTemplate(tpl, key, id, undefined, val), key, val, id);
    } else {
      h = self._esc(val);
    }

    var root = this._rootEl(app);
    if(root) {
      root.querySelector("[bind='" + id + "']").innerHTML = h;
      self._syncDirectives(key, root.querySelector("[bind='" + id + "']"));
    }
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
    var out = s.replace(
      /\{\{[^\}]*\}\}/g,
      function(val, index) {
        return self.tempValue(val, key, obj, id, n);
      });
    if(this.config.debug && out.indexOf('{{')>-1) this._warn('Unresolved template in app "'+key+'"');
    return out;
  },
  tempValue: function(s, key, obj, id, n) {
    var self = this;
    var raw = s.replace(/\{\{|\}\}/g,'').trim();
    var html = false;
    if(raw.indexOf('html')===0){
      html = true;
      raw = raw.slice(4).trim();
    }
    var parts = raw.split('||');
    var expr = parts[0].trim();
    if(expr.indexOf('this.')===0) expr = key+'.data.'+expr.slice(5);
    else if(expr==='value' && id) expr = key+'.data.'+id;
    var callArg = null;
    var paren = expr.indexOf('(');
    if(paren>-1 && expr.slice(-1)===')'){
      callArg = expr.slice(paren+1,-1).trim();
      expr = expr.slice(0,paren).trim();
    }
    var v = self._resolve(expr);
    var ctx = self.apps[key];
    if(typeof v==='function'){
      if(paren>-1 && callArg){
        var con = typeof n!=='undefined' ? key+'.data.'+id+'['+n+']' : key+'.data.'+id;
        v = v.call(ctx, self._resolve(callArg.split('this').join(con)));
      } else {
        v = typeof n!=='undefined' ? v.call(ctx,n,obj) : v.call(ctx,obj);
      }
    }
    if(parts[1] && v==null) v = parts[1].trim();
    if(self.apps[key].filters && self.apps[key].filters[id]) v = self.apps[key].filters[id](v);
    if(typeof v==='object' && v && v.text) v = v.text;
    if(typeof v==='object' && v && v[0] && v[0].text) v = v.map(function(u){return u.text;}).join(', ');
    return self._out(v,html);
  },
  _syncBind: function(key, id, mode) {
    var self = this;
    var app = this.apps[key];
    var tag = app.tag[id];
    var el = app.el[id];
    var val = app.data[id];

    if(mode === 'read'){
      switch(tag){
        case 'RADIO':
          app.values[id] = {
            id: el.querySelector('input:checked').value,
            text: el.querySelector('input[value="' + el.value + '"]').innerHTML
          };
          break;
        case 'CHECKBOX':
          var cv = el.checked ? 1 : 0;
          app.data[id] = app.values[id] = { id: cv, text: el.parentNode.innerHTML };
          break;
        case 'INPUT':
        case 'TEXTAREA':
          app.values[id] = app.data[id] = el.value;
          break;
        case 'SELECT':
          app.values[id] = { id: el.value, text: el.options[el.selectedIndex].text };
          break;
        case 'MULTIPLE':
          app.values[id] = [];
          Array.from(el.value).forEach(function(obje){
            app.values[id].push({ id: obje, text: el.querySelector('option[value="' + obje + '"]').innerHTML });
          });
          break;
        default:
          app.data[id] = el.innerHTML;
      }
    } else {
      switch(tag){
        case 'UL':
          el.innerHTML = self.render(key, id);
          break;
        case 'RADIO':
          if(app.values[id]) el.querySelector('input[name="' + id + '"][value="' + app.values[id].id + '"]').checked = true;
          break;
        case 'CHECKBOX':
          el.checked = val ? true : false;
          break;
        case 'INPUT':
        case 'TEXTAREA':
          el.value = val;
          break;
        case 'SELECT':
          if(!app.values[id] && app.data[id][0].id!="") app.values[id] = app.data[id][0];
          if(app.values[id]) el.value = app.values[id].id;
          break;
        case 'MULTIPLE':
          if(app.values[id]){
            var ids = [];
            Array.from(app.values[id]).forEach(function(obje){ ids.push(obje.id); });
            if(ids.length) el.value = ids;
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
          el.textContent = val != null ? val : '';
      }
      this.mirror(key);
    }
    if(app.change[id]) app.change[id].call(app, app.data[id], id, key);
  },
  setData: function(key, id) {
    this._syncBind(key, id, 'read');
  },
  setHTML: function(key, id) {
    this._syncBind(key, id, 'write');
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
    if (app.change[id]) app.change[id].call(app, val, id, key);

    if (app.templates[id] && !value) this.render(key, id);
    else this.setHTML(key, id);
    var root = this._rootEl(app);
    if(root) this._syncDirectives(key, root);
  },
  push: function(key, id, val, index) {
    if (val == '') val = null;
    var app = this.apps[key];
    if (typeof index !== 'undefined') app.data[id].splice(index, 0, val);
    else app.data[id].push(val);
    if (app.change[id]) app.change[id].call(app, app.data[id], id, key);
    if (!this._patchPushList(key, id, index)) {
      if (app.templates[id]) this.render(key, id);
      else this.setHTML(key, id);
    }
    var root = this._rootEl(app);
    if(root) this._syncDirectives(key, root);
  },
  pop: function(key, id, index) {
    var app = this.apps[key];
    if (typeof index !== 'undefined') app.data[id].splice(index, 1);
    else app.data[id].pop();
    if (app.change[id]) app.change[id].call(app, app.data[id], id, key);
    if (!this._patchPopList(key, id, index)) {
      if (app.templates[id]) this.render(key, id);
      else this.setHTML(key, id);
    }
    var root = this._rootEl(app);
    if(root) this._syncDirectives(key, root);
  },
  getVals: function(key, ids) {
    var app = this.apps[key];
    if (!app) return {};
    if (!Array.isArray(ids)) ids = [ids];
    var o = {};
    ids.forEach(function(id) {
      o[id] = app.values[id] !== undefined ? app.values[id] : app.data[id];
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
  routing: function(done) {
    var route = '/error';
    var _path = '';
    var self = this;

    for (var i = 0, total = this.url.length; i < total; i++) {
      _path += (i ? '/' + this.url[i] : this.url[i]);
      if (this.routes['/' + _path]) route = '/' + _path;
    }

    if (this.routes[route]) {
      if (this.routeInit) this.routeInit();
      var key = this.routes[route];
      if (this.activeRoute && this.activeRoute !== key) {
        var prev = this.apps[this.activeRoute];
        if (prev && prev.destroy) prev.destroy.call(prev);
      }
      var routeApp = this.apps[key];
      if (routeApp) {
        routeApp._booted = false;
        routeApp._booting = false;
        routeApp._bootWait = [];
      }
      document.querySelector(this.apps[key].root).innerHTML = self.loadTemplate;
      this.activeRoute = this.routes[route];
      var depth = route === '/' ? 0 : route.slice(1).split('/').length;
      this.urlTail = this.url.slice(depth);
      if (routeApp) routeApp.urlTail = this.urlTail;
      this.loadApps([key], done);
      if (this.routeReady) this.routeReady();
    } else if(done) {
      done();
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
      fetch(path).then(function(response) {
          return response.text();
        }).then(function(e) {
          if (func) func(self.parse(e));
          if (self.el.progress) self.el.progress.style.display = 'none';
        }).catch(function(e) {
          if (func) func({ error: true, xhr: e });
          if (self.el.progress) self.el.progress.style.display = 'none';
        });
    } else {
    
      fetch(path, {
			method: 'POST',
			body: pax.objectToFormData(query) //JSON.stringify(query)
        }).then(function(response) {
          return response.text();
        }).then(function(e) {
          if (self.el.progress) self.el.progress.style.display = 'none';
          if (func) func(self.parse(e));
        }).catch(function(e) {
        	
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
  table: function(obj, vars, config, key, tbody) {
    var self = this;
    if (!key) key = 'id';
    if (!obj || !obj.length) return "<table><tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody></table>";
    var h = '<table><thead><tr>';
    var body = '<tbody>';
    if (!vars) {
      var keys = [];
      Object.entries(obj[0]).forEach(function([k, o]) {
        h += '<th>'+self._esc(k.split('_').join(' '))+'</th>';
        keys.push(k);
      });
      h += '</tr></thead>';
      obj.forEach(function(o, i) {
        body += o[key] ? "<tr data-id='"+self._esc(o[key])+"' data-index='"+i+"'>" : "<tr data-id='"+i+"' data-index='"+i+"'>";
        keys.forEach(function(k) {
          var v = o[k];
          if (typeof v === 'object' && v.text) v = v.text;
          if (typeof v === 'object' && v[0] && v[0].text) v = v.map(function(u) {
            return u.text;
          }).join(', ');
          body += v != null ? '<td>'+self._esc(v)+'</td>' : '<td></td>';
        });
        body += '</tr>';
      });
    } else {
      vars.forEach(function(o) {
        h += o.thead ? '<th>'+self._esc(o.thead)+'</th>' : '<th>'+self._esc(o.id.split('_').join(' '))+'</th>';
      });
      h += '</tr></thead>';
      obj.forEach(function(o, i) {
        var cl = config.cl ? 'onclick="'+config.cl+'(this)"' : '';
        body += o[key] ? "<tr data-id='"+self._esc(o[key])+"' data-index='"+i+"' "+cl+'>' : "<tr data-id='"+i+"' data-index='"+i+"' "+cl+'>';
        vars.forEach(function(k) {
          var val = self._get(k.id, o);
          if (k.filter) val = k.filter(val, o);
          body += val != null ? '<td>'+self._esc(val)+'</td>' : '<td></td>';
        });
        body += '</tr>';
      });
    }
    return tbody ? body + '</tbody>' : h + body + '</tbody></table>';
    },
    objectToFormData:function  (val, formData, name_space) {
		if(!formData) formData = new FormData();
		if(!name_space) name_space = '';
		if ((typeof val !== 'undefined') && (val !== null)) {
			if (val instanceof Date) {
				formData.append(name_space, val.toISOString());
			} else if (val instanceof Array) {
				for (let i = 0; i < val.length; i++) {
					pax.objectToFormData(val[i], formData, name_space + '[' + i + ']');
				}
			} else if (typeof val === 'object' && !(val instanceof File)) {
				if (val instanceof FileList) {
					for (let i = 0; i < val.length; i++) {
						formData.append(name_space + '[]', val[i]);
					}
				} else {
					for (let propertyName in val) {
						if (val.hasOwnProperty(propertyName)) {
							pax.objectToFormData(val[propertyName], formData, name_space ? name_space + '[' + propertyName + ']' : propertyName);
						}
					}
				}
			} else if (val instanceof File) {
				formData.append(name_space, val);
			} else {
				formData.append(name_space, val.toString());
			}
		}
		return formData;
    }
};
var _pax = new $pax();
var pax = _pax._view();
var app = _pax.apps;
function paxReady() { pax.init(); }
if (typeof window !== 'undefined') {
  window.pax = pax;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', paxReady);
  } else {
    paxReady();
  }
}
export default pax;
export { pax };