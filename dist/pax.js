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
        if(!array || !array.length) {
            if(fun) fun();
            return;
        }
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
        var total = (app.preload) ? Object.keys(app.preload).length : 0;
        if(total) {
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
        //this.setVisible(key);
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
            var html = $(o).html();
            switch(tag){
                case 'UL':case 'OL':
                    if(!app.temp[id]) app.temp[id] = '<li>{{val}}</li>';
                    if(app.data[id]) {
                        //alert(key+' '+)
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
                    
                    //if(app.temp[id])  
                    ///app.temp[id] = " ";
                    self.render(key,id);
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
       
        if(!this.apps[key]) {
            alert('App "'+key+'" does not exist');
            return;
        }
        if(!id) return this.loadApps([key]);

        var self = this;
        var app = this.apps[key];
        
        //if(!app.temp[id]) return app.data[id];
       

        var tag = app.tag[id];
        var val = app.data[id];
        var h = '';
        
        if(!val) return;
        
        if(Array.isArray(val)){
            if(!app.temp[id]) {
                h=JSON.stringify(val);
            } else {
                $.each(app.data[id],function(n,li){
                    var s = app.temp[id].valueOf().toString();
                    s = s.split("{{i}}").join(n);
                    s = s.split("{{val}}").join(li);
                    s = s.split("{{this").join('{{'+key+'.data.'+id+'['+n+']');
                    s = self.tempString(s,key);
                    h+=s;
                });
            }
        } else if(typeof val === 'object') {
            if(!app.temp[id]) {
                h=JSON.stringify(val);
            } else {
                $.each(app.data[id],function(n,li){
                    var s = app.temp[id].valueOf().toString();
                    s = s.split("{{i}}").join(n);
                    s = s.split("{{val}}").join(li);
                    s = s.split("{{this").join('{{'+key+'.data.'+id+'["'+n+'"]');
                    s = self.tempString(s,key);
                    h+=s;
                });
            }
        } else {
            var str = app.data[id];
            
            if(app.temp[id]) {
                var s = app.temp[id].valueOf().toString();
                //s = s.split("this").join(key+'.data.'+id);
                s = s.split("{{val").join('{{'+key+'.data.'+id);
                s = self.tempString(s,key);
                h+=s;
            } else {
                h=str;
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
    router:function(){
       
        var self = this;
        if(this.routeHash) {
            this.setPath(0,1);
            window.addEventListener('hashchange', function(){self.setPath()});
        } else {
            this.setPath(0,1);
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
            if(this.routeInit) this.routeInit();
            var key = this.routes[route];
            this.loadApps([key]);
            if(this.routeReady) this.routeReady();
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
};

$pax.prototype.rend = 
{
    mode:1,
    pages: function(page,max,total,el,fun) {
        total = Math.ceil(total/max);
            
        var prev = page-1;
        var next = page+1;
        if((total*max)<=max) return $(el).html('');
        html = (page!=0) ? '<li><a data-id="'+prev+'" ><</a></li>' : '';
        var skipped = false;
        
        for(var i=0; i<total; i++) {
            if(total<6 || i==0 || i==total-1 || i==page || i>page-2 && i<page+2) {
                var p = (i==page) ? 'active' : '';
                html+='<li class="'+p+'"><a data-id="'+i+'" >'+(i+1)+'</a></li>';
                skipped = false;
            } else {
                if(!skipped) html+='<li>...</li>';
                skipped = true;
            }
        }
        html += (page!=total-1) ? '<li><a data-id="'+next+'" >></a></li>' : '';
        var self = this;
        $(el).html(html);
        $(el).find('a').on('click',function(){
            fun(Number($(this).attr('data-id')));
        })
    },
    list:function(obj,opt){
        opt = (opt) ? opt : {};
        var attr = '';
        if(opt.attr) $.each(o.attr,function(k,v) {attr+=' data-'+k+'="'+v+'"'});
        h='<ul '+attr+'>';
        if(typeof obj[0]!='object') {
            $.each(obj,function(i,o){
                h+='<li>'+o+'</li>';
            });
            return h+='</ul>';
        } else {
            $.each(obj,function(i,o){
                var attr = '';
                if(o.attr) $.each(o.attr,function(k,v) {attr+=' data-'+k+'="'+v+'"'});
                var click = (o['liClick']) ? "onclick='"+o['liClick']+"(this)'" : ''; 
                h+='<li '+attr+' '+click+'>'+o.label+'</li>';
            });
            return h+='</ul>';
        }
    },
    table:function(obj,vars,opt) {
        var self = this;
        if(!opt) opt = {};
        if(obj.length==0)  return  "<tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody>";
        var h = "<thead><tr>";
        if(!vars){
            /*
            $.each(obj,function(i,o) {
                h+="<th>"+o.id+"</th>";
            });*/
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
    },
    tableRow:function(obj,vars,opt) {
        if(!opt) opt = {};
            var o  = obj;
            var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
            var attr = '';
            $.each(opt.attr,function(x,a) {attr+=' data-'+a+'="'+o._source[a]+'"'});
            var h="<tr data-id='"+o.id+"'  "+click+" "+attr+">";
            $.each(vars,function(i,v){
                if(typeof v.id === 'string') {
    
                val1 = (v.key) ? v.key[o[v.id]] : o[v.id];
                val1 = (v.func) ? v.func(val1) : val1;
                val2 = (v.val) ? v.val : '';
                } else {
    
                val1 = v.val;
                }
    
                h+= (val1!=null) ? "<td>"+val1+"</td>" : "<td>"+val2+"</td>";
            });
            return h+="</tr>";
    },
    form:function(e,opt){
        var h='';
        var self = this;
        var noWrap = {'checkbox':1,'grid':1}
        if(!opt){
            opt = [];
            $.each(e,function(k,o){
                opt.push([{type:'text',label:k,id:k}]);
            });
        }
        $.each(opt,function(i,row){
            var showRow = true;
            if(row.length==1 && row[0].type=='hidden') showRow =false;
            if(showRow) h+="<li id='li-row"+i+"'>";
            $.each(row,function(n,td){
                var showTD = true;
                var label = (td.label) ? '<label for="'+td.id+'" class="label">'+td.label+' <a class="pencil right absolute"></a></label>' : '';
                if(td.type=='title' || td.type=='description') label = '';
                var cl='class="'+td.type;
                if(td.tdClass) $.each(td.tdClass,function(i,c){cl+=" "+c;});
                cl+='"';
                var id= (td.id) ? 'id="td-'+td.id+'"' : '';
                if(td.type=='hidden') showTD = false;
    
                if(showRow && showTD) h+="<div "+cl+" "+id+">"+label;
                    h+=self.vewType(td,e);
                if(showRow && showTD) h+="</div>";

            });
            h+="</li>";
        })
        return h;
    },
    format:function(data){
        var a=[];
        $.each(data, function(i,o){
            o._id = i;
            if(!o.col) o.col = 0;
            if(!a[o.row]) a[o.row] = [];
            a[o.row][o.col] = o;
        });
        return a;
    },
    vewType:function(td,e){
        
        val = this._get(td.id,e);
        
        var self = this;
        var h = attr = cl='';
        if(td.attr) $.each(td.attr,function(k,o){attr+=k+"='"+o+"' ";})
        if(td.class) cl='class="',$.each(td.class,function(i,c){cl+=c+" ";}),cl+='"';
        
        switch(td.type){
            case 'text':
                return "<input type='text' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";
            case 'password':
                return "<input type='password' name='"+td.id+"'  id='"+td.id+"' value='"+val+"' "+attr+" "+cl+">";
            case 'title':
                return '<h1>'+td.label+'</h1>';
            //return '';
            case 'description':
                return td.description;
            //return '';
            case 'html':
                return td.html;
            case 'document':
            
                return "<input type='file' id='"+td.id+"' name='"+td.id+"' value='"+val+"' "+attr+" "+cl+">";
            case 'paragraph':
                return "<textarea type='text' name='"+td.id+"' id='"+td.id+"' "+attr+" "+cl+">"+val+"</textarea>";
            case 'hidden':
                return "<input type='hidden' id='"+td.id+"' name='"+td.id+"' value='"+val+"'>";
            case 'grid':
                var h =  "<table>";
                var labelRow = (td.row_labels.length) ? 1 : 0;
                if(td.labels.length) h+='<thead><tr>';
                $.each(td.labels,function(i,lab) {
                        h+='<th>'+lab+'</th>';
                });
                if(td.labels.length) h+='</tr></thead>';
                h+='<tbody>';
                    $.each(td.rows,function(i,row) {
                        h+='<tr>';
                        if(labelRow){
                            var label = (td.row_labels[i]) ? td.row_labels[i] : '';
                            h+='<th>'+label+'</th>';
                        }
                        $.each(row,function(i,sub_td) {
                            h+='<td id="'+sub_td.id+'" class="'+sub_td.type+'">'+self.vewType(sub_td,e)+'</td>';
                        });
                        h+='</tr>';
                    });
                return h+"</tbody></table>";
            case 'checkbox':
                h='<span class="pa">';
                if(td.options) {
                    $.each(td.options,function(i,o) {
                        var val = (e[o.id]) ? e[o.id] : 0;
                        var checke = (parseInt(val)) ? 'checked' : '';
                        if(!e[o.id] && o.default) 
                        checke = 'checked';
                        attr=cl='';
                        if(o.attr) $.each(o.attr,function(k,a){attr+=k+"='"+a+"' ";})
                        if(o.class) cl='class="',$.each(o.class,function(i,c){cl+=c+" ";}),cl+='"';
                        //<input type='hidden' value='0' name='"+o.id+"'>
                        h+="<label><input type='checkbox' name='"+o.id+"' value='1' "+attr+" "+cl+" "+checke+"> "+o.label+"</label>";
                    });
                    return h+'</span>';
                } else {
                    var checked = (parseInt(val)) ? 'checked' : '';
                    var label = (td.ch_label) ? td.ch_label : td.label;
                    h+= " <label><input type='checkbox' name='"+td.id+"' value='1' "+checked+"> "+label+"</label>";
                    return h;
                }
            case 'radio':
                h='<span class="form-pad">';
                    $.each(td.options,function(n,o){
                        var checked = (o.value==val) ? 'checked' : '';
                        var value = (typeof o.value !== 'undefined') ? o.value : '';
                        
                        h+= " <label><input type='radio' name='"+td.id+"' value='"+value+"' "+checked+"> "+o.label+"</label>";
                    });
    
                    return h+'</span>';
    
            case 'list':
                //util.print(e)
                h+='<select id="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'>';
    
                if(td.json){
                    this.loading=1;
                    pax.ajax(td.json,{},function(e){
                        var h = '';
                        $.each(e,function(n,o){
                            
                            var selected = (o.id && o.id==val.id) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('#'+td.id).html(h);
                        $('#'+td.id).select2();
                    });
                    return h+'<option>Loading...</option></select>';
                }
                if(td.url){
                    if(val) {
                        $.each(val,function(i,o){
                            h+='<option value="'+o.id+'" selected>'+o.text+'</option>';
                        });
                    }
                    var ret = (td.data) ? td.data+'=data;' : '';
                    
                    return h+"</select><script>$(function(){$('#"+td.id+"').select2({ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){"+ret+"return{results:data}}}})});</script>";
                }
                
                $.each(td.options,function(n,o){
                    
                    var selected = (o.value==val.value) ? 'selected' : '';
                    if(!val.value) selected=(o.value==td.default) ? 'selected' : '';
                    var value = (typeof o.value !== 'undefined') ? o.value : '';
                    
                    h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                });
                return h+'</select>';
            case 'multi':
                h+='<select id="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+' multiple>';
                if(td.json){
                    // var selected = (e[td.id].id && e[td.id].id.indexOf(o.id)>=0) ? 'selected' : '';
                    this.loading=1;
                    pax.ajax(td.json,0,function(e){
                        var h = '';
                        $.each(e,function(n,o){
                            var selected = (val.id && val.id.indexOf(o.id)>=0) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('#'+td.id).html(h);
                        $('#'+td.id).select2();
                    });
                    return h+'<option>Loading...</option></select>';
                }
                if(td.url){
                    
                    if(val) {
                       
                        $.each(val.id,function(i,o){
                            h+='<option value="'+val.id[i]+'" selected>'+val.text[i]+'</option>';
                        });
                       
                    }
                    return h+"</select><script>$(function(){$('#"+td.id+"').select2({ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){return{results:data}}}})});</script>";
                }
             
                $.each(td.options,function(n,o){
                    var selected = (val && val.values && val.values.indexOf(o.value)>=0) ? 'selected' : '';
                    var value = (typeof o.value !== 'undefined') ? o.value : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                });
                return h+'</select>';
            default:
                return td.html;
        }
    },
    tempValue:function(s,o){
        var self = this;
        s = s.replace('{{','').replace('}}','');
        var v = eval(s);
        return (typeof v != 'undefined') ? v : '';
    },
    tempString:function(s,o) {
        var self = this;
        return  s.replace(
            /\{\{[^\}]*\}\}/g,
            function (val, index) { return self.tempValue(val,o); });
    },
    temp:function(template,object){
       
        var self = this;
        var h = '';
        if(Array.isArray(object) || typeof object === 'object'){
            $.each(object,function(n,ob){
                s = template.split("{{i}}").join(n);
                s = s.split("{{this").join('{{o');
                s = self.tempString(s,ob);
                h+=s;
            });
        } else {
            s = template.split("{{this").join('{{o');
            h = self.tempString(s,object);
        } 
        return h;
    },
    data:function(el){
		var obj = {};
        var self = this;
        if(!el) el = 'body';
		$(el).find("[name]").each(function(i,o){
			var id = $(o).attr('name');
			var tag = $(o).prop("tagName");
			if(tag=='SELECT' && $(o).attr('multiple')) tag='MULTIPLE';
            if(tag=='INPUT' && $(o).attr('type')=='checkbox') tag='CHECKBOX';
            if(tag=='INPUT' && $(o).attr('type')=='radio') tag='RADIO';
            if(tag=='INPUT' && $(o).attr('type')=='button') tag='BUTTON';
			if(tag=='INPUT' && $(o).attr('type')=='submit') tag='BUTTON';
			switch(tag){
                case 'INPUT':case 'TEXTAREA':
					self._set(id,$(o).val(),obj);
                break;
                case 'SELECT':
					self._set(id,{id:$(o).val(),label:$(o).find('option:selected').html()},obj);
                break;
                case 'MULTIPLE':
                    var mult = {id:[],text:[],index:[]};
                    $.each($(o).find('option:selected'),function(){
                        mult.id.push($(this).val());
                        mult.text.push($(this).html());
                        mult.index.push($(this).index());
                    });
					self._set(id,mult,obj);
                break;
                break;case 'RADIO':
					if($(o).prop('checked')) self._set(id,$(o).val(),obj);
                break;
                case 'CHECKBOX':
					var vl = ($(o).prop('checked')) ? 1 : 0;
					self._set(id,vl,obj);
                break;
                default:
                    //(self.val[id]) ? $(o).html(self.render(id)) : self.val[id] = $(o).html();
            }
        });
        return obj;
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
    }
};
$search = function(o) {this.init(o);};
$search.prototype = 
{
    el:{
        page:null,
        progress:null,
    },
    html:{
        load:"<tbody><tr><td><p class='pulse al-center'>LOADING</p></td></tr></tbody>"
    },
    server:"/call/json/crud/search/",
    data:{not:[],must:[],should:[]},
    query:{},
    queryString:"",
    timer:null,
    sort:"_id",
    order:"desc",
    total:0,
    max:10,
    page:0,
    hits:0,
    loading:0,
    init: function(o) {
       
        this.el.page = (o.page) ? o.page : 0;
        this.el.prog= (o.prog) ? o.prog : 0;
        if(o.input) this.setInput(o.input);
        this.server = (o.url) ? o.url : 0;
        if(o.render) this.render = o.render;
    
    },
    setInput:function(el){
        $(el).bind("input", {
            self: this
        },function( event ) {
            var self = event.data.self;
            var val = $(this).val();
            if(self.queryString==val) return 0;
            
            clearTimeout(self.timer);
            self.timer = setTimeout(self.inputCall,300,self,val);
        });
    },
    inputCall: function(self,val){
        var vl = val.toLowerCase().trim();
        //if(vl.slice(-1)==' ') vl = vl.slice(0, -1);
        self.query = (vl=="") ? 0 : {"query_string":{"query":'*'+vl+'*',"default_operator": "AND"}};
        self.page = 0;
        self.search();
        self.queryString = val;
    },
    search: function(query,max,page,sort,order,after) {
        if(!max) max = this.max;
        if(!page) page = this.page;
        if(!sort) sort = this.sort;
        if(!order) order = this.order;
        var path = this.server+'/'+page+'/'+max+'/'+order+'/'+sort;
        if(after) path = path+'/'+after;
        this.data = (query) ? query : this.data;
        this.post(path);
    },
    render:function(){return "<p>There are no results</p>"},
    progFadeIn:function(){
        if(this.el.progress) $(this.el.progress).removeClass('fade-out').addClass('fade').show();
    },
    progFadeOut:function(){
        if(this.el.progress) $(this.el.progress).removeClass('fade').addClass('fade-out');
    },
    post:function(path){
        this.progFadeIn();
        var self = this;
        var query = {not:[],must:[],should:[]};
        query = JSON.parse(JSON.stringify(this.data));
        if(this.query.query_string) query.must.push(self.query);
       // pax.print(query);
        pax.ajax(path,query,function(e){
            self.progFadeOut();
            if(e.error){
                self.sort = '_id';
                return;
                self.complete(e);
            } else {
                self.complete(e);
            }
        });
    },
    complete: function(e) {
        
        if(!e.error && e.hits.length>0){
            var pageTotal = (e.count<=10000) ? e.count : 10000;
            this.total = Math.ceil(pageTotal/this.max);
            this.hits =e.count;
            this.results = e.hits;
            this.pagination();
            this.render(e.hits);
        } else {
            e = [];
            this.total =0;
            this.pagination();
            this.render(e);
        }
    },

    pagination: function() {
       
        if(!this.el.page) return 0;
        var prev = this.page-1;
        var next = this.page+1;
    
        if((this.total*this.max)<=this.max) return $(this.el.page).html('');
        html = (this.page!=0) ? '<li><a data-id="'+prev+'" ><</a></li>' : '';
        var skipped = false;
        for(var i=0; i<this.total; i++) {
            if(this.total<6 || i==0 || i==this.total-1 || i==this.page || i>this.page-2 && i<this.page+2) {
                var p = (i==this.page) ? 'active' : '';
                html+='<li class="'+p+'"><a data-id="'+i+'" >'+(i+1)+'</a></li>';
                skipped = false;
            } else {
                if(!skipped) html+='<li>...</li>';
                skipped = true;
            }
        }
        html += (this.page!=this.total-1) ? '<li><a data-id="'+next+'" >></a></li>' : '';
        var self = this;
       
        $(this.el.page).html(html);
        $(this.el.page).find('a').on('click',function(){
            self.changePage(Number($(this).attr('data-id')));
        });
    },
    changePage: function(p) {
        this.page = p;
        this.search();
    },
    setSort:function(sort){
        this.order = (this.order=='asc') ? 'desc' : 'asc';
        this.sort = sort;
        this.page=0;
        this.search();
    },
    elSort:function(t){
        sort = $(t).attr('data-id');
        this.order = (this.order=='asc') ? 'desc' : 'asc';
        this.sort = sort;
        this.page=0;
        this.search();
    }
}
    
    

    
    
