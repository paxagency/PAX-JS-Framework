var $pax = function(o) {};
$pax.prototype = {
    url:[],
    routes:{},
    routeTags:{},
    routeHash:0,
    apps:{},
    appLength:0,
    appIndex:0,
    loadMethods:{},
    routeFade:1,
    routeMove:1,
    appGlob:[],
    appInit:[],
    el:{routes:'#routes'},
    init:function(o){
        var self = this;
        //Set templates
        $('template').each(function(){
            var key = $(this).attr('pax');
            var template = $(this).html();
            if(typeof key !== 'undefined') {
            	var url = key.split('_').join('/');
            	if(url=="index") url = "";
                if(!self.apps[key]) self.apps[key] = {};
				if(!self.apps[key].template) self.apps[key].template = template;
				if(!self.apps[key].url) self.apps[key].url = "/"+url;
            }
        });
        //Set app defaults and routes
        $.each(this.apps,function(k,o){
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
        //load gobal apps, then non routed apps
        this.loadApps(self.appGlob,function(){
        	self.loadApps(self.appInit,function(){
        		//load route
        		self.routing();
        	});
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
    loadApps:function(array,fun){
        if(!array || !array.length) {if(fun) fun();return;}
       	var self = this;
       	var total = array.length-1;
       	var index = 0;
       	$.each(array,function(i,o){
       		(i==total) ? self.loadApp(o,fun) : self.loadApp(o);
       	});
    },
    loadApp:function(key,fun){
    	var requests=[];
    	var self = this;
    	var app = this.apps[key];
    	var total = (app.load) ? Object.keys(app.load).length : 0;
    	if(!total) {
			self.initApp(key);
			if(fun) fun();
			return false;
		}
    	var index = 0;
		$.each(app.load,function(k,o){
			if(o.url) {
				 var query = (o.query) ? o.query : 0;
				 self.ajax(o.url,query,function(e){
				 	self.setLoad(key,k,e);
				 	index++;
				 	if(index==total){
				 		self.initApp(key);
						if(fun) fun();
				 	}
				 })
			}
		});	
    },
    setLoad:function(key,k,e){
    	var app = this.apps[key];
    	app.load[k].data = e;
		if(app.load[k].init) self.call(e,app.load[k].init);
		if(app.load[k].ready) {
			if(!self.loadMethods[key]) self.loadMethods[key] = [];
			self.loadMethods[key].push({method:app.load[k].ready,data:e});
		}
    },
    call:function(v,f){
        var exp = f.split('.');
        var obj= window['app'];
        $.each(exp,function(i,k){
            obj = obj[k];
        });
        return (v) ? obj(v) : obj(0);
    },
    initApp:function(key) {
    	var self =this;
    	var app = this.apps[key];
		if(!app.root && $('[pax="'+key+'"]').length) app.root = '[pax="'+key+'"]';
		if(app.prerend) app.prerend();
		if(app.root) this.renderApp(key);
		if(app.ready) app.ready();
		if(this.loadMethods[key]) $.each(this.loadMethods[key],function(i,o){self.call(o.data,o.method);});
    },
    renderApp:function(key){
        var self = this;
        var app = this.apps[key];
        app.set = function(id,val,mode){pax.set(key,id,val,mode);}
        app.push = function(id,val,index){pax.push(key,id,val,index);}
        app.pop = function(id,val){pax.pop(key,id,val);}
        app.render = function(){pax.renderChildren(key);}
        if(!app.template) app.template = $(app.root).html();
        $(app.root).html(self.rendTemplate(key)); 
        this.renderChildren(key);
        if(app.root==pax.el.routes){
			if(self.routeFade) {
				$(app.root).attr("style","transition:none;opacity:0;");
				setTimeout(function(){$(app.root).attr("style","opacity:1; transition: opacity .3s;");},10);
			}
			if(self.routeMove) $("html, body").animate({ scrollTop: 0 }, 100);
        }
    },
    renderChildren:function(key){
        var self = this;
        var app = this.apps[key];
       
        $(app.root).find("[pax]").each(function(i,o){
            var tag = $(o).prop("tagName");
            var id = $(o).attr('pax');
            
            app.el[id] = $(o);
            if(tag=='template') return false;
            if(tag=='SELECT' && $(o)[0].hasAttribute('multiple')) tag='MULTIPLE';
            if(tag=='INPUT' && $(o).attr('type')=='checkbox') tag='CHECKBOX';
            if(tag=='INPUT' && $(o).attr('type')=='radio') tag='IGNORE';
            if(tag=='INPUT' && $(o).attr('type')=='button') tag='BUTTON';
            if(tag=='INPUT' && $(o).attr('type')=='submit') tag='BUTTON';
            if($(o).attr('pax-type')) tag = $(o).attr('pax-type').toUpperCase();
            app.tag[id] = tag;
            var html = $(o).html();
            switch(tag){
                case 'UL':case 'OL':
                    if(!app.templates[id]) app.templates[id] = '<li data-index="{{index}}">{{value}}</li>';
                    if(app.data[id]) {
                        self.render(key,id);
                    } else {
                        app.data[id] = [];
                        $(o).find('li').each(function(n,li){app.data[id].push($(li).html())})
                    }
                break;case 'RADIO':
                    if(!app.templates[id]) app.templates[id] = "<label><input type='radio' value='{{this.id}}' name='"+id+"'>{{this.text}}</label> ";
                    if(app.data[id]) {
                        $(app.el[id]).html(self.render(key,id));
                    } else {
                        app.data[id] = [];
                        $(app.el[id]).find('input[name="'+id+'"]').each(function(n,li){
                            app.data[id].push({id:$(li).val(),text:$(li).html()});
                        });
                    }
                    if(app.values[id]) $(app.el[id]).find('input[name="'+id+'"][value="'+app.values[id].id+'"]').attr('checked', true);
                    $(app.el[id]).find('input[name="'+id+'"]').on('change',{self:self},function(e){
                        self.setData(key,id);
                    });
                break;
                case 'CHECKBOX':
                    if(app.data[id]) {
                        $(o).parent().html("<label><input type='checkbox' name='"+id+"' pax='"+id+"' />"+app.data[id].text+"</label>");
                        if(app.data[id].id) $(o).prop("checked",true);
                    } else {
                         app.data[id]={id:0,text:$(this).parent().text()};
                    }
                    $(app.el[id]).on('change',{self:self},function(e){e.data.self.setData(key,id)})
                break;
                case 'INPUT':
                    (app.data[id] || app.data[id]==0) ? $(o).val(app.data[id]) : app.data[id] = self.numString($(o).val());
                    $(app.el[id]).on('keyup',{self:self},function(e){ e.data.self.setData(key,id);});
                break;
                case 'TEXTAREA':
                    (app.data[id]) ? $(o).html(app.data[id]) : app.data[id] = self.numString($(o).html());
                    $(app.el[id]).on('focusout',{self:self},function(e){e.data.self.setData(key,id)})
                break;
                case 'SELECT':
                    if(!app.templates[id]) app.templates[id] = "<option value='{{this.id}}'>{{this.text}}</option>";
                    if(app.data[id]) {
                        $(app.el[id]).html(self.render(key,id));
                    } else {
                        app.data[id] = [];
                        $(app.el[id]).find('option').each(function(n,li){
                            app.data[id].push({id:$(li).val(),text:$(li).html()});
                        });
                    }
                    if(app.values[id]) $(app.el[id]).val(app.values[id].id);
                    $(app.el[id]).on('change',{self:self},function(e){
                        self.setData(key,id);
                    });
                break;
                case 'TABLE':
                    var opt = (app.templates[id]) ? app.templates[id] : 0;
                    $(app.el[id]).html(self.table(app.data[id],opt));
                break;case 'MULTIPLE':
                    if(!app.templates[id]) app.templates[id] = "<option value='{{this.id}}'>{{this.text}}</option>";
                    if(app.data[id]) {
                        $(app.el[id]).html(self.render(key,id));
                    } else {
                        app.data[id] = [];
                        $(app.el[id]).find('option').each(function(n,li){
                            app.data[id].push({id:$(li).val(),text:$(li).html()});
                        });
                    }
                    if(app.values[id]){
                        var ids = [];
                        $.each(app.values[id],function(q,obje){ids.push(obje.id);});
                        if(ids.length) $(app.el[id]).val(ids);
                    }
                    $(app.el[id]).on('change',{self:self},function(e){
                        self.setData(key,id);
                    });
                break;
                default:
                    if(!app.templates[id]) app.templates[id] = '{{value}}';
                    if(!app.data[id]) app.data[id] = self.numString($(o).html());
                    self.render(key,id);
            }
        });
    },
    render:function(key,id){
        if(!this.apps[key]) return "";
        if(!id) return this.loadApps([key]);
        var self = this;
        var app = this.apps[key];
        var data = app.data[id];
        var h = '';
        if(!data) data = "";
       
        if(Array.isArray(data)){
            if(!app.templates[id]) {
                h=JSON.stringify(data);
            } else {
                $.each(app.data[id],function(n,li){
                    var s = app.templates[id].valueOf().toString();
                    s = s.split("{{index}}").join(n);
                    s = s.split("{{value}}").join(li);
                    s = self.tempString(s,key,li,n,id);
                    h+=s;
                });
            }
        } else {
            if(!app.templates[id]) {
                h=(typeof data === 'object') ? JSON.stringify(data) : data;
            } else {
                var s = app.templates[id].valueOf().toString();
                s = (s=="{{value}}") ? app.data[id] : self.tempString(s,key,app.data[id],0,id);
                h+=s;
            }
        } 
        $(app.el[id]).html(h);
        return h;
    },
    tempString:function(s,key,obj,n,id) {
        var self = this;
        if(s.indexOf('{{') == -1) return s;
        return s.replace(/\{\{[^\}]*\}\}/g,function(match){
        	match = match.replace('{{','').replace('}}','');
			if(match.indexOf(".")>=0) {
				parts = match.split(".");
				k = parts.splice(0,1);
				match = parts.join();
				if(k=="this") {
					var val =  self._get(match,obj);
				} else {
					var val =  self._get(match,pax.apps[k]);
				}
				if(typeof val =='function') {
					val = (typeof n!='undefined') ?  val(n,obj) : val(obj);
				} 
			} else {
				var val= self._get(match,obj);
			}
			return val;
        });
    },
    rendTemplate:function(key){
        if(!this.apps[key].template) return '';
        var s = this.apps[key].template.valueOf().toString();
        if(s.indexOf('{{') == -1) return s;
        return this.tempString(s,key,this.apps[key].data);
    },
    setData:function(key,id) {
        var self = this;
        var app = this.apps[key];
        var tag = app.tag[id];
        var el = app.el[id];

        switch(tag){
            case 'RADIO':
                app.values[id] = {id:$(el).find('input:checked'),text:$(el).find('input[value="'+$(el).val()+'"]').html()};
            break; case 'CHECKBOX':
                var v = ($(el).prop('checked')) ? 1 : 0;
                app.data[id]=app.values[id] ={id:v,text:$(el).parent().text()};
            break; case 'INPUT':
                app.values[id] = app.data[id] = $(el).val();
            break; case 'TEXTAREA':
                app.values[id] = app.data[id] = $(el).val();
            break; case 'SELECT':
                app.values[id] = {id:$(el).val(),text:$(el).find(':selected').html()};
            break; case 'MULTIPLE':
                app.values[id] =  [];
                var vals = $(el).val();
                $.each(vals,function(q,obje){
                    app.values[id].push(
                        {id:obje,text:$(el).find('option[value="'+obje+'"]').html()}
                    );
                });
            break; default:
                app.data[id] = $(el).html();
        }
        if(app.change[id]) app.change[id](app.data[id],id,key);
    },
	numString:function(s){
		//if(s=='') return null;
  		//return (!isNaN(s) && s[0]!='0') ? parseFloat(s) : s;
        return s;
  	},
  	setHTML:function(key,id) {
        var self = this;
        var app = this.apps[key];
        var val = app.data[id];
		var tag = app.tag[id];
        var el = app.el[id];
       
		switch(tag){
            case 'UL':
				$(el).html(self.render(key,id));
			break;case 'RADIO':
                if(app.values[id]) $(el).find('input[name="'+id+'"][value="'+app.values[id].id+'"]').attr('checked', true);
			break;case 'CHECKBOX':
			  	(val) ? $(el).prop("checked",true) : $(el).prop("checked",false);
			break;case 'INPUT':
                $(el).val(val);
			break;case 'TEXTAREA':
			  	$(el).val(val);
			break;case 'SELECT':
                if(app.values[id]) $(el).val(app.values[id].id);
            break;case 'MULTIPLE':
                if(app.values[id]){
                    var ids = [];
                    $.each(app.values[id],function(q,obje){ids.push(obje.id);});
                    (ids.length) ? $(el).val(ids) : $(el).val('');
                }
            break;default:
			 	$(el).html(val);
          }
          if(app.change[id]) app.change[id](app.data[id]);
    },
    set:function(key,id,val,value){
        if(val=='') val=null;
        var app = this.apps[key];
        
        (value) ? this._set(id,value,app.values) : this._set(id,val,app.data);
        if(id.indexOf('.')>-1) id = id.split('.')[0];
        if(app.change[id]) app.change[id](val,id,key);
        
        if(app.templates[id] && !value) {
            this.render(key,id);
            this.setHTML(key,id);
        } else {
            this.setHTML(key,id);
        }
    },
    load:function(o){
  	     var self = this;
  	     $.each(o,function(k,v){self.set(k,v);});
    },
    setVar:function(id,key,val){
        if(!val) return;
        var a = key.split('.');
        var c = a.length-1;
        if(!this.va[id]) this.va[id] = {};
        var obj = this.va[id];
        $.each(a,function(n,o){
        	if(!obj[o]) obj[o] = {};
        	if(n==c) obj[o] = val;
        	obj = obj[o];
        });
    },
    push:function(key,id,val,index){
        if(val=='') val=null;
        var app = this.apps[key];
        (typeof index != undefined) ?  app.data[id].splice(index, 0, val) : app.data[id].push(val);
        if(app.change[id]) app.change[id](app.data[id],id,key);
        if(app.templates[id]) {
            this.render(key,id);
        } else {
            this.setHTML(key,id);
        }
    },
    pop:function(key,id,index){
        var app = this.apps[key];
        (typeof index!=undefined) ? app.data[id].splice(index, 1) : app.data[id].pop();
        if(app.change[id]) app.change[id](app.data[id],id,key);
        if(app.templates[id]) {
            this.render(key,id);
        } else {
            this.setHTML(key,id);
        }
    },
    getVals:function(ids){
          var self = this;
          var o = {};
          $.each(ids, function(i,id){o[id]=self.data[id]});
          return o;
    },
    print:function(o){
  	    if(!o) return alert(JSON.stringify(this.data, null, 2));
        alert(JSON.stringify(o, null, 2));
    },
    log:function(s){
        window.console.log(s);
    },
    href:function(u){
        window.location.href = u;
    },
    link:function(path){
        window.history.pushState(path, path, path);
        this.setPath(path);
    },
    setRouter:function(){
        var self = this;
        if(this.routeHash) {
            window.addEventListener('hashchange', function(){self.setPath()});
        } else {
            window.onpopstate = function(e){self.setPath(e.state)};
        }
     	this.setGetVars();
        this.setPath(0,1);
    },
    setPath:function(path,noRoute){
        if(this.routeHash) {
        	this.path = location.hash.substr(2);
            this.url = this.path.split('/');
        } else {
        	this.path = (path) ? path.substr(1) : window.location.pathname.substr(1)
            this.url = this.path.split('/');
        }
        if(!noRoute) this.routing();
    },
    setGetVars:function (variable){
		   var query = window.location.search.substring(1);
		   var vars = query.split("&");
		   pax.getVars = {};
		   for (var i=0;i<vars.length;i++) {
				var pair = vars[i].split("=");
				pax.getVars[pair[0]] = pair[1]; 
		   }
	},
    routing:function (){
        var route='/error';
        var route2=0;
        var _path= '';
        var _path2= '';
        
        for (var i=0, total=this.url.length; i < total; i++) {
            _path+=(i) ? '/'+this.url[i] : this.url[i];
            _path2+=(i) ? "_"+this.url[i] : this.url[i];
            if(this.routes['/'+_path]) route = '/'+_path;
            if(this.routeTags[_path2]) route2 = _path2;
        }
     	
        if(this.routes[route]) {
            if(this.routeInit) this.routeInit();
            var key = this.routes[route];
            this.activeRoute = this.routes[route];
            this.loadApps([key]);
            
            if(this.routeReady) this.routeReady();
            $.each(this.apps,function(k,o){
                if(o.appReady) o.appReady();
            });
        } 
    },
     parse:function(text){
        if (typeof text!=="string") return text;
        try {
            var j = JSON.parse(text);
            return j;
        } catch (error){
            return {error:1,message:'Server Error'};
        }
    },
    ajax:function(path,query,func){
        var self = this;
        if(!query){
            $.get(path).done(function(e) {
                if(func) func(self.parse(e));
                if(self.el.progress) $(self.el.progress).hide();
            }).fail(function(e,st) {
                if(func) func({'error':true,xhr:e,status:st});
                if(self.el.progress) $(self.el.progress).hide();
            });
        } else {
            $.post(path, query).done(function(e) {
                if(self.el.progress) $(self.el.progress).hide();
                if(func) func(self.parse(e));
            }).fail(function(e,st) {
                if(self.el.progress) $(self.el.progress).hide();
                if(func) func({'error':true,xhr:e,status:st});
            });
        }
    },
    _get:function(str,obj){
		if(!str) return '';
		str = str.split("[").join(".").split("]").join("").replace('()','');
		obj = (obj) ? obj : window;
		if(str.indexOf(".")<0) return (typeof obj[str] !== "undefined") ? obj[str] : '';
		return str.split('.').reduce(function (o,v) {
			return o ? o[v] : '';
		}, obj);
	},
    _set:function(path,value,obj,first){
        if(!path) return '';
        obj = (obj) ? obj : window;
        if(path.indexOf(".")>-1) path =  path.split(".");
        if (Array.isArray(path) && path.length > 1) {
            if (!obj.hasOwnProperty(path[0]) || typeof obj[path[0]] !== "object") {
                obj[path[0]] = (Number.isInteger(parseInt(path[1]))) ? [] : {};
            }
            first = (first) ? first : obj[path[0]];
            return this._set(path.slice(1), value, obj[path[0]],first);
        } else {
            obj[path] = value;
            return first;
        }
    },
    clone:function(obj){
        var o = JSON.parse(JSON.stringify(obj));
        $.each(obj,function(k,v){
        	if (typeof v === 'function') o[k] = v;
        });
        return o;
    },
    table:function(obj,vars,key,tbody) {
        var self = this;
		if(!key) key = "id"; 
		if(!obj.length)  return  "<table><tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody></table>";
		var h = "<table><thead><tr>";
		var body = "<tbody>";
		if(!vars){
			$.each(obj[0],function(k,o) {h+="<th>"+k.split("_").join(" ")+"</th>";});
			h+="</tr></thead>";
			$.each(obj,function(i,o) {
				body += (o[key]) ? "<tr data-id='"+o[key]+"' data-index='"+i+"'>" : "<tr data-id='"+i+"' data-index='"+i+"'>";
				$.each(o,function(i,v){
					body+= (v!=null) ? "<td>"+v+"</td>" : "<td></td>";
				});
				body+="</tr>";
			});
		} else {
			$.each(vars,function(n,o){ 
				h+=(o.thead) ? "<th>"+o.thead+"</th>" : "<th>"+o.id.split("_").join(" ")+"</th>"; 
			});
			h+="</tr></thead>";
			$.each(obj,function(i,o) {
				body += (o[key]) ? "<tr data-id='"+o[key]+"' data-index='"+i+"'>" : "<tr data-id='"+i+"' data-index='"+i+"'>";
				$.each(vars,function(n,k){
					var val = self._get(k,o);
					body+= (val!=null) ? "<td>"+val+"</td>" : "<td></td>";
				});
				body+="</tr>";
			});
		}
		return (tbody) ? body+"</tbody>" : h+body+"</tbody></table>";
    }
};
var pax = new $pax();
var app = pax.apps;
$(function(){
	pax.init();
});