var $pax = function(o) {};
$pax.prototype = {
    _url:[],
    routes:{},
    routeHash:0,
    apps:{},
    appLength:0,
    appIndex:0,
    visible:{},
    el:{
        routes:'#routes',
    },
    init:function(o){
        var self = this;
        this.router();
        this.appGlob = [];
        this.appInit = [];
        
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
        this.loadApps(self.appGlob,function(){
            self.loadApps(self.appInit,function(){
                self.routing();
            });
        });
    },
    setDefaults:function(o){
        o.root = (o.root) ? o.root : 0;
        o.el = (o.el) ? o.el : {};
        o.tag = (o.tag) ? o.tag : {};
        o.data = (o.data) ? o.data : {};
        o.vals = (o.vals) ? o.vals : {};
        o.str = (o.str) ? o.str : {};
        o.temp = (o.temp) ? o.temp : {};
        o.change = (o.change) ? o.change : {};
        return o;
    },
    loadApps:function(array,fun){
        var self = this;
        this.appTotal = array.length;
        this.appIndex = 0;
        $.each(array,function(i,key){
            if(self.apps[key].init) self.apps[key].init();
            self.loadRequests(key,fun);
        });
    },
    loadRequests:function(key,fun){
        var self = this;
        var app = this.apps[key];
        if(app.preload) {
            var total = Object.keys(app.preload).length;
            var index = 0;
            $.each(app.preload,function(k,o){
                if(o.url) {
                    var query = (o.query) ? o.query : 0;
                    self.ajax(o.url,query,function(e){
                        app.preload[k].data = e;
                        if(app.preload[k].call) app[app.preload[k].call](e);
                        index++;
                        self.finished(key,fun,total,index);
                    });
                } else {
                    index++;
                    self.finished(key,fun,total,index);
                }
            });
        } else {
            self.finished(key,fun);
        }
    },
    finished:function(key,fun,total,index){
        if(!total || total==index) {
            this.appIndex++;
            var app = this.apps[key];
            if(app.prerend) app.prerend();
            if(app.root) this.renderApp(key);
            if(app.ready) app.ready();
            if(this.appTotal==this.appIndex) {
                if(fun) fun();
            }
        }
    },
    renderApp:function(key){
        var self = this;
        var app = this.apps[key];
        this.setVisible(key);
        if(app.template) $(app.root).html(self.rendTemplate(key)); 
        if(!app.template) app.template = $(app.root).html();
        this.renderChildren(key);
    },
    renderChildren:function(key){
        var self = this;
        var app = this.apps[key];
        $(app.root).find("[pax]").each(function(i,o){
            var tag = $(o).prop("tagName");
            var id = $(o).attr('pax');
            app.el[id] = $(o);

            if(tag=='SELECT' && $(o).attr('multiple')) tag='MULTIPLE';
            if(tag=='INPUT' && $(o).attr('type')=='checkbox') tag='CHECKBOX';
            if(tag=='INPUT' && $(o).attr('type')=='radio') tag='RADIO';
            if(tag=='INPUT' && $(o).attr('type')=='button') tag='BUTTON';
            if(tag=='INPUT' && $(o).attr('type')=='submit') tag='BUTTON';
            app.tag[id] = tag;
          
            switch(tag){
                case 'UL':case 'OL':
                    if(!app.temp[id]) app.temp[id] = '<li>{{val}}</li>';
                    if(app.data[id]) {
                        self.render(key,id)
                    } else {
                        app.data[id] = [];
                        $(o).find('li').each(function(n,li){app.data[id].push($(li).html())})
                    }
                break;case 'RADIO':
                    if(app.data[id] || app.data[id]==0) $(o).val([app.data[id]]);
                    $(app.el[id]).on('change',{self:self},function(e){e.data.self.setData(key,id)})
                break;
                case 'CHECKBOX':
                    (app.data[id]) ? $(o).prop("checked",true) : app.data[id]=0;
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
                    if(!app.temp[id]) app.temp[id] = "<option value='{{this.value}}'>{{this.text}}</li>";
                    if(app.data[id]) {
                        $(app.el[id]).html(self.rend.temp(app.temp[id],app.data[id]));
                        if(app.vals[id]) $(app.el[id]).val(app.vals[id]);
                    } else {
                        app.data[id] = [];
                        $(app.el[id]).find('option').each(function(n,li){
                            app.data[id].push({value:$(li).val(),text:$(li).html()});
                        });
                    }
                    $(app.el[id]).on('change',{self:self},function(e){
                        //e.data.self.setData(key,id)
                        app.vals[id] = $(this).val();
                    })
                break;
                case 'TABLE':
                    var opt = (app.temp[id]) ? app.temp[id] : 0;
                    $(app.el[id]).html(self.table(app.data[id],opt));
                break;case 'MULTIPLE':
                    /*(app.data[id] || app.data[id]==0) ? $(o).val(app.data[id]) : app.data[id] = $(o).val();
                    if(app.data[id]) {
                        self.render(key,id);
                    } else {
                        app.data[id] = [];
                        $(o).find('li').each(function(n,li){app.data[id].push($(li).html())})
                    }
                    $(app.el[id]).on('change',{self:self},function(e){e.data.self.setData(key,id)})*/
                break;
                default:
                    if(app.temp[id])  self.render(key,id);
                    //(app.data[id]) ? self.render(key,id) : app.data[id] = $(o).html();
            }
        });
    },
    tempValue:function(s,key){
        var self = this;
        s = s.replace('{{','').replace('}}','');
        var v = eval("this.apps."+s);
        return (typeof v != 'undefined') ? v : '';
    },
    tempString:function(s,key) {
        var self = this;
        return  s.replace(
            /\{\{[^\}]*\}\}/g,
            function (val, index) { return self.tempValue(val,key); });
    },
    rendTemplate:function(key){
        var s = this.apps[key].template.valueOf().toString();
        if(s.indexOf('{{') == -1) return s;
        s = s.split("this.").join(key+'.data.');
        return this.tempString(s,key);
    },
    render:function(key,id){
        var self = this;
        var app = this.apps[key];
        
        if(!id) return this.renderApp(key);
        if(!app.temp[id]) return app.data[id];
       
        var tag = app.tag[id];
        var val = app.data[id];
        var h = '';
        
        if(Array.isArray(val)){
            $.each(app.data[id],function(n,li){
                var s = app.temp[id].valueOf().toString();
                s = s.split("{{i}}").join(n);
                s = s.split("{{val}}").join(li);
                s = s.split("{{this").join('{{'+key+'.data.'+id+'['+n+']');
                
                s = self.tempString(s,key);
                h+=s;
            });
        } else if(typeof val === 'object') {
            $.each(app.data[id],function(n,li){
                var s = app.temp[id].valueOf().toString();
                s = s.split("{{i}}").join(n);
                s = s.split("{{val}}").join(li);
                s = s.split("{{this").join('{{'+key+'.data.'+id+'["'+n+'"]');
                s = self.tempString(s,key);
                h+=s;
            });
        } else {
            var str = app.data[id];
            if(app.temp[id]) {
                var s = app.temp[id].valueOf().toString();
                //s = s.split("this").join(key+'.data.'+id);
                s = s.split("{{this").join('{{'+key+'.data');
                s = self.tempString(s,key);
                h+=s;
            }
        }
        
        $(app.el[id]).html(h);
        
        return h;
    },
    setData:function(key,id) {
        var self = this;
        var app = this.apps[key];
        var tag = app.tag[id];
        var el = app.el[id];

        switch(tag){
            case 'RADIO':
                app.data[id] = self.numString($(el).val());
                app.str[id] = $(el).find(':checked').parent().text();
            break; case 'CHECKBOX':
                app.data[id] = ($(el).prop('checked')) ? 1 : 0;
                app.str[id] = $(el).parent().text();
            break; case 'INPUT':
                app.data[id] = self.numString($(el).val());
            break; case 'TEXTAREA':
                app.data[id] = self.numString($(el).val());
            break; case 'SELECT':
                app.data[id] = self.numString($(el).val());
                app.str[id] = $(el).find(':selected').html();
            break; case 'MULTIPLE':
                app.data[id] = $(el).val();
                app.str[id] = [];
                $.each($(el).find('option:selected'),function(x,l){
                    app.str[id].push($(this).html());
                });
            break; default:
                app.data[id] = $(el).val();
        }
        if(app.change[id]) app.change[id](app.data[id]);
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
			  	$(el).val([val]);
			break;case 'CHECKBOX':
			  	(val) ? $(el).prop("checked",true) : $(el).prop("checked",false);
			break;case 'INPUT':
                $(el).val(val);
			break;case 'TEXTAREA':
			  	$(el).val(val);
			break;case 'SELECT':
				app.str[id] = $(el).find('option[value="'+val+'"]').html();
			 	$(el).find('option[value="'+val+'"]').prop("selected",true);
			break;case 'MULTIPLE':
			   	$(el).val(val);
            break;default:
			 	$(el).html(val);
          }
          if(app.change[id]) app.change[id](app.data[id]);
    },
    set:function(key,id,val){
        if(!val) val=null;
        var app = this.apps[key];
        app.data[id] = val;
        //this.render(key,id);
        if(app.temp[id]) {
            this.render(key,id);
            if(app.change[id]) app.change[id](app.data[id]);
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
    push:function(id,val){
        if(!val) return;
        this.data[id].push(val);
        this.setHTML(id);
    },
    remove:function(id,index){
        this.data[id].splice(index, 1);
        this.setHTML(id);
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
    href:function(u){
        window.location.href = u;
    },
    link:function(path){
        window.history.pushState(path, path, path);
        this.routing(path);
    },
    router:function(){
        var self = this;
        if(this.routeHash) {
            this.setPath(0,0);
            window.addEventListener('hashchange', function(){self.setPath()});
        } else {
            this.setPath(0,0);
            window.onpopstate = function(e){self.setPath(e.state)};
        }
    },
    setPath:function(path,noRoute){
        if(this.routeHash) {
            this._url = location.hash.substr(2).split('/');
        } else {
            this._url = (path) ? path.substr(1).split('/') : window.location.pathname.substr(1).split('/');
        }
        if(!noRoute) this.routing();
    },
    routing:function (){
        var route='/error';
        var _path= '';
        for (var i=0, total=this._url.length; i < total; i++) {
            _path+=(i) ? '/'+this._url[i] : this._url[i];
            if(this.routes['/'+_path]) route = '/'+_path;
        }
        if(this.routes[route]){
            var key = this.routes[route];
            this.loadApps([key]);
        }
    },
     parse:function(text){
        if (typeof text!=="string")return false;
        try{
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
                e = self.parse(e);
                if(func) func(e);
            }).fail(function(e,st) {
                (func) ? func({'error':true,xhr:e,status:st}) : self.complete({'error':true,xhr:e,status:st});
            });
        } else {
            $.post(path, query).done(function(e) {
                e = self.parse(e);
                if(!e) e = '{error:1}';
                if(self.animate) $("html,body").animate({scrollTop:0},"slow");
                if(self.el_progress) $(self.el_progress).hide();
                (func) ? func(e) : self.complete(e);
            }).fail(function(e,st) {
                if(self.el_progress) $(self.el_progress).hide();
                (func) ? func({'error':true,xhr:e,status:st}) : self.complete({'error':true,xhr:e,status:st});
            });
        }
    },
    vis:function(el,key,id,val,eq){
        val = (val) ? val : 1;
        eq = (eq) ? eq : '==';
        if(el[0].match(/[a-z]/i)) el = this.apps[key].el[el];
        (this.apps[key].data[id]==val) ? $(el).show() : $(el).hide();
    },
    setVisible:function(key){
        if(!this.visible[key]) return;
        $.each(this.visible[key],function(k,o){
            (this.apps[key].data[k]==o.val) ? $(o.el).show() : $(o.el).hide();
        })
    },
    _get:function(str,obj){
        if(!str) return '';
        obj = (obj) ? obj : window;
        if(str.indexOf(".")<0) return (typeof obj[str] !== "undefined") ? obj[str] : '';
        return str.split('.').reduce(function (o,v) {return o?o[v]:'';}, obj);
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
        //return Object.assign({}, obj);
        return JSON.parse(JSON.stringify(obj));
    },
    table:function(obj,vars,opt) {
        var self = this;
        this.mode = 0;
        if(!opt) opt = {};
        if(obj.length==0)  return  "<tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody>";
        var h = "<thead><tr>";
        if(!vars){
            var first = (this.mode) ? obj[0]._source : obj[0];
            $.each(first,function(k,o) {
                h+="<th>"+k+"</th>";
            });
        } else {
            $.each(vars,function(k,v){
                if(v.thead){
                    var click = (opt['thClick']) ? "onclick='"+opt['thClick']+"(this)'" : '';
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+v.thead+"</th>";
                }
            });
        }
        h+="</tr></thead><tbody>";
        if(!vars){
            $.each(obj,function(i,o) {
                if(self.mode) o._source._id =  o._id;
                o = (self.mode) ? o._source : o; 
                
                
                var id = (o._id) ? "data-id='"+o._id+"'" : "";
                var attr = '';
                if(opt.trAttr) $.each(opt.trAttr,function(i,trK) {attr+=' data-'+trK+'="'+o[trK]+'"'});
                
                h+="<tr "+attr+" "+id+" data-index='"+i+"'>";
                var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                $.each(o,function(i,v){
                    h+= (v!=null) ? "<td "+click+">"+v+"</td>" : "<td></td>";
                });
                h+="</tr>";
            });
            return h+"</tbody>";
        } else {
            $.each(obj,function(i,o) {
                if(self.mode) o._source._id =  o._id;
                o = (self.mode) ? o._source : o; 
                var attr = '';
                if(opt.trAttr) $.each(opt.trAttr,function(i,trK) {attr+=' data-'+trK+'="'+o[trK]+'"'});
                    
                h+="<tr "+attr+"  data-index='"+i+"'>";
                $.each(vars,function(n,v){
                    var k = v.id;
                    attr = '';
                    if(opt.attr) $.each(opt.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.attr) $.each(v.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                    if(v['tdClick']) "onclick='"+v['tdClick']+"(this)'";
                    var val = (v.val) ? v.val : self._get(k,o);
                    
                    if(v.key) val = v.key[val];
                    if(v.call) val = v.call(val);
                    h+= (val!=null) ? "<td "+click+" "+attr+">"+val+"</td>" : "<td "+click+" "+attr+"></td>";
                });
                h+="</tr>";
            });
            return h+"</tbody>";
        }
    }
}
