var $pax = function(o) {};
$pax.prototype = {
    url:[],
    routes:{},
    routeTags:{},
    routeHash:0,
    apps:{},
    appLength:0,
    appIndex:0,
    el:{routes:'#routes'},
    init:function(o){
        var self = this;
        this.appGlob = [];
        this.appInit = [];
        $('template').each(function(){
            var key = $(this).attr('pax');
            var url = $(this).attr('pax-url');
            var h = $(this).html();
            if(typeof key !== 'undefined') {
                if(self.apps[key]){
                    if(!self.apps[key].template) self.apps[key].template = h
                } 
            } else if(typeof url !== 'undefined') {
                var ur = url.split('-').join('/');
                self.apps[url] = {
                    url:'/'+ur,
                    template:h
                }
            }
        });
        this.setRouter();
        
        $.each(this.apps,function(k,o){
            self.setDefaults(o);
            if(o.url) {
                //add to routes array
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
        //first load gobal apps
        this.loadApps(self.appGlob,function(){
            //load remainder apps if not ignored
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
        o.str = (o.str) ? o.str : {};
        o.templates = (o.templates) ? o.templates : {};
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
        var total = (app.load) ? Object.keys(app.load).length : 0;
        if(total) {
            var index = 0;
            $.each(app.load,function(k,o){
                if(o.url) {
                    var query = (o.query) ? o.query : 0;
                    self.ajax(o.url,query,function(e){
                        app.load[k].data = e;
                        //if(app.load[k].call) app[app.load[k].call](e);
                        if(app.load[k].call) self.call(e,app.load[k].call);
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
    call:function(v,f){
        var exp = f.split('.');
        var obj= window['app'];
        $.each(exp,function(i,k){
            obj = obj[k];
        });
        return (v) ? obj(v) : obj(0);
    },
    finished:function(key,fun,total,index){
        if(!total || total==index) {
            this.appIndex++;
            var app = this.apps[key];
            if(!app.root && $(['pax="'+key+'"']).length) app.root = '[pax="'+key+'"]';
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
        app.set = function(id,val,mode){pax.set(key,id,val,mode);}
        app.push = function(id,val){pax.push(key,id,val);}
        app.pop = function(id,val){pax.pop(key,id,val);}
        //if(app.template) $(app.root).html(self.rendTemplate(key)); 
        if(!app.template) app.template = $(app.root).html();
        $(app.root).html(self.rendTemplate(key)); 
        this.renderChildren(key);
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
                    if(!app.templates[id]) app.templates[id] = '<li data-index="{{i}}">{{val}}</li>';
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
                    (app.data[id]) ? self.render(key,id) : app.data[id] = self.numString($(o).html());
            }
        });
    },
    render:function(key,id){
        if(!this.apps[key]) {
            alert('App "'+key+'" does not exist');
            return;
        }
        if(!id) return this.loadApps([key]);
        var self = this;
        var app = this.apps[key];
       
        var tag = app.tag[id];
        var val = app.data[id];
        var h = '';
        
        if(!val) return;
        
        if(Array.isArray(val)){
            if(!app.templates[id]) {
                h=JSON.stringify(val);
            } else {
                $.each(app.data[id],function(n,li){
                    var s = app.templates[id].valueOf().toString();
                    s = s.split("{{i}}").join(n);
                    s = s.split("{{val}}").join(li);
                    s = s.split("{{this").join('{{'+key+'.data.'+id+'['+n+']');
                    s = self.tempString(s,key);
                    h+=s;
                });
            }
        } else if(typeof val === 'object') {
            if(!app.templates[id]) {
                h=JSON.stringify(val);
            } else {
                $.each(app.data[id],function(n,li){
                    var s = app.templates[id].valueOf().toString();
                    s = s.split("{{i}}").join(n);
                    s = s.split("{{val}}").join(li);
                    s = s.split("{{this").join('{{'+key+'.data.'+id+'["'+n+'"]');
                    s = self.tempString(s,key);
                    h+=s;
                });
            }
        } else {
            var str = app.data[id];
            if(app.templates[id]) {
                var s = app.templates[id].valueOf().toString();
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
    rendTemplate:function(key){
        var s = this.apps[key].template.valueOf().toString();
        if(s.indexOf('{{') == -1) return s;
        s = s.split("this.").join(key+'.data.');
        return this.tempString(s,key);
    },
    tempString:function(s,key) {
        var self = this;
        return  s.replace(
            /\{\{[^\}]*\}\}/g,
            function (val, index) { return self.tempValue(val,key); });
    },
    tempValue:function(s,key){
        var self = this;
        s = s.replace('{{','').replace('}}','');
        var v = eval("this.apps."+s);
        return (typeof v != 'undefined') ? v : '';
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
                //app.data[id] = $(el).val();
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
			 	//$(el).html(val);
          }
          if(app.change[id]) app.change[id](app.data[id]);
    },
    set:function(key,id,val,value){
        if(val=='') val=null;
        var app = this.apps[key];
        //app.data[id] = val;
        (value) ? this._set(id,val,app.values) : this._set(id,val,app.data);
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
    push:function(key,id,val){
        if(val=='') val=null;
        var app = this.apps[key];
        app.data[id].push(val);
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
     
        this.setPath(0,1);
    },
    setPath:function(path,noRoute){
        if(this.routeHash) {
            this.url = location.hash.substr(2).split('/');
        } else {
            this.url = (path) ? path.substr(1).split('/') : window.location.pathname.substr(1).split('/');
        }
        if(!noRoute) this.routing();
    },
    routing:function (){
        var route='/error';
        var route2=0;
        var _path= '';
        var _path2= '';
        
        for (var i=0, total=this.url.length; i < total; i++) {
            _path+=(i) ? '/'+this.url[i] : this.url[i];
            _path2+=(i) ? "-"+this.url[i] : this.url[i];
            if(this.routes['/'+_path]) route = '/'+_path;
            if(this.routeTags[_path2]) route2 = _path2;
        }
        
        if(this.routes[route]){
            if(this.routeInit) this.routeInit();
            var key = this.routes[route];
            this.loadApps([key]);
            if(this.routeReady) this.routeReady();
            $.each(this.apps,function(k,o){
                if(o.appReady) o.appReady();
            });
        } 
    },
     parse:function(text){
        if (typeof text!=="string")return text;
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


$pax.prototype.rend = //var $render = function(type) {};
{
    fileServer:"",
    mode:0,
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
        //obj = obj.hits;
        if(!opt) opt = {};
        if(obj.length==0)  return  "<tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody>";
        var h = "<thead><tr>";
        if(!vars){
            $.each(obj[0],function(k,o) {
                h+="<th>"+k+"</th>";
            });
        } else {
            $.each(vars,function(k,v){
                var click = (opt['thClick']) ? "onclick='"+opt['thClick']+"(this)'" : '';
                if(v.thead){
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+v.thead+"</th>";
                } else {
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+v.label+"</th>";
                   
                }
            });
        }
        h+="</tr></thead><tbody>";
        if(!vars){
            $.each(obj,function(i,o) {
                var id = (o.id) ? "data-id='"+o.id+"'" : "";
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
                var attr = '';
                if(opt.trAttr) $.each(opt.trAttr,function(i,trK) {attr+=' data-'+trK+'="'+o[trK]+'"'});
                var id = (o.id) ? "data-id='"+o.id+"'" : "";
                h+="<tr "+id+" "+attr+"  data-index='"+i+"'>";
                $.each(vars,function(n,v){
                    var k = v.id;
                    attr = '';
                    if(opt.attr) $.each(opt.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.attr) $.each(v.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                    if(v['tdClick']) click="onclick='"+v['tdClick']+"(this)'";
                    
                    var val = (v.val) ? v.val : self._get(k,o);
                    if(v.key) val = v.key[val];
                    if(v.ids) {
                        $.each(v.ids,function(x,ids){
                            val+=" "+self._get(ids,o);
                        });
                    }
                    
                    if(v.call) val = self.call(val,v.call);
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
            $.each(opt.attr,function(x,a) {attr+=' data-'+a+'="'+o[a]+'"'});
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
            if(showRow) h+="<li data-key='"+i+"' class='li-row"+i+"'>";
            $.each(row,function(n,td){
                if(td.type=='array'){
                    var l = (e[td.id]) ? e[td.id].length : 1;
                    z = 0;
                    var frame = pax.clone(td.frame);
                    while(z<l){
                        $.each(td.frame,function(x,td2){
                            var dat = (e[td.id] && e[td.id][z]) ? pax.clone(e[td.id][z]) : {};
                            var newId = frame[x].id+(z.toString());
                            td2.id = newId;
                            if(dat[frame[x].id]) dat[newId] = dat[frame[x].id];
                            //pax.print(dat[td2.id]);
                            h+=self.renderRow(td2,dat,self);
                        });
                        h+="<div class='html'><a class='green txt' onclick='pax.rend.plus(\""+td.id+"\")'>&plus;</a> <a class='red txt' onclick='app.add.minus(this)'>&times;</a></div>";
                        z++;
                        if(z!=l) h+="</li><li>";
                    }
                } else {
                    h+=self.renderRow(td,e,self);
                }
                
            });
            h+="</li>";
        });
        return h;
    },
    formTable:function(e,opt){
        
        var self = this;
       
        self.data = e;
        self.opt = (opt) ? opt : [];
        if(!opt.length){$.each(e,function(k,o){opt.push([{type:'text',label:k,id:k}]);});}
        if(!e) e = [{}];
        var h = '<tbody>';
        var thead = "<thead><tr>";
       
        x=0;
        while(x<=e.length-1){
            var dat = e[x];
            $.each(opt,function(i,row){
                h+="<tr data-key='"+x+"' class='li-row"+x+"'>";
                $.each(row,function(n,td){
                    if(!x) thead+= (td.label) ? "<th>"+td.label+"</th>" : "<th>"+td.id+"</th>";
                    var o = pax.clone(td);
                    delete o.label;
                    h+=self.renderRow(o,dat,self,'td');
                });
                h+="<td class='html'><a class='green txt' onclick='app.add.plus(this)'>&plus;</a> <a class='red txt' onclick='app.add.minus(this)'>&times;</a></td>";
                h+="</tr>";
            });
            x++;
        }
        thead+="<tr></thead>";
        h+="</tbody>";
        return thead+h;
    },
    plus:function(id){
        //alert(id);
        pax.rend.data[id].push({});
        pax.print(pax.rend.data);
        var h = pax.rend.form(pax.rend.data,pax.rend.opt);
        //alert(pax.rend.data);
        pax.rend.render(h);
    },
    renderRow:function(td,e,self,tag){
        var h=  '';
        tag = (!tag) ? "div" : tag;
        var showTD = true;
        var label = (td.label) ? '<label for="'+td.id+'" class="label">'+td.label+'</label>' : '';
        if(td.type=='title' || td.type=='description') label = '';
        var cl='class="'+td.type;
        if(td.tdClass) $.each(td.tdClass,function(i,c){cl+=" "+c;});
        cl+='"';
        var id= (td.id) ? 'id="td-'+td.id+'"' : '';
        var dataId = (td.id) ? 'data-id="'+td.id+'"' : "";
        if(td.type=='hidden') showTD = false;
        var extra = (td.preHtml) ? td.preHtml : "";
        if(showTD) h+="<"+tag+" "+cl+" "+dataId+" "+id+" data-type='"+td.type+"'>"+label+extra;
            if(td.pre) h+="<span class='prefix'>"+td.pre+"</span>";
            h+=self.vewType(td,e);
        if(showTD) h+="</"+tag+">";
       
        return h;
    },
    call:function(v,f){
        var exp = f.split('.');
        var obj= window['app'];
        $.each(exp,function(i,k){
            obj = obj[k];
        });
        return (v) ? obj(v) : obj(0);
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
        var self = this;
        val = this._get(td.id,e);
        if(td.val) val = td.val;
        if(td.call) val = this.call(val,td.call);
        
        var self = this;
        var h = attr = cl='';
        if(td.attr) $.each(td.attr,function(k,o){attr+=k+"='"+o+"' ";});
        if(td.required) attr+="vreq='1' ";
        if(!td.class || typeof td.class!='object') td.class = [];
        td.class.push(td.id);
        td.class.push('input');
        cl='class="'+td.class.join(' ')+'"';
       
         if(val==null) val = '';
        switch(td.type){
            case 'text':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";
            case 'id':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='id'>";
                case 'number':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='decimal'>";
                case 'money':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='money' vpre='$'>";
                case 'phone':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='phone'>";
                case 'email':
                return "<input type='text' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='email' vfoc='email'>";
                case 'image':
                   
                    var h ="<p class='center'>";
                    if(!val) return h+'<span class="inputs"></span><span class="images"></span><br /><input type="file"></input></p>';
                    if( typeof val !='object') {
                        return h+"<span class='inputs'><input type='hidden' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"'></input></span><span class='images'><img src=\""+self.fileServer+val+"\" style='max-height:200px;'/></span><br /><input type='file' ></p>"
                    } else {
                        var inputs = '<span class="inputs">';
                        var images = '<span class="images">';
                        $.each(val,function(i,o){
                            inputs+="<input type='hidden' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"[]' value=\""+val+"\"'></input>";
                            images+="<img src=\""+self.fileServer+val+"\" style='max-height:200px;'/>";
                        });
                        return h+inputs+"</span>"+images+"</span><br /><input type='file' ></p>";
                    }
                    return "<div id='"+td.id+"'></div><script> $('#"+td.id+"').zoomy(['"+val.join("','")+"'],{});</script>";
               
               case 'table':
                   return "<table class='list'>"+self.table(val)+"<table>";
            case 'password':
                return "<input type='password' data-type='"+td.type+"' name='"+td.id+"'  id='"+td.id+"' value='"+val+"' "+attr+" "+cl+">";
            case 'title':
                return '<h1>'+td.label+'</h1>';
            case 'description':
                return td.description;
            case 'html':
                return td.html;
            case 'raw':
                return val;
            case 'document':
                return "<input data-type='"+td.type+"' type='file' id='"+td.id+"' name='"+td.id+"' value='"+val+"' "+attr+" "+cl+">";
            case 'paragraph':case 'body':
                return "<textarea type='text' name='"+td.id+"' id='"+td.id+"' "+attr+" "+cl+">"+val+"</textarea>";
            case 'hidden':
                return "<input data-type='"+td.type+"' type='hidden' id='"+td.id+"' name='"+td.id+"' value='"+val+"'>";
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
                        h+="<label><input type='checkbox' name='"+o.id+"' value='1' "+attr+" "+cl+" "+checke+"> "+o.text+"</label>";
                    });
                    return h+'</span>';
                } else {
                    var checked = (val==1 || val==true) ? 'checked' : '';
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
                var ran = 'list'+Math.random()*10000;
                h+='<select id="'+td.id+'" data-ran="'+ran+'" data-key="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'>';
                if(td.json){
                   
                    this.loading=1;
                    var id = td.id;
                    var valueId = val.id;
                    pax.ajax(td.json,{},function(e){
                        var h = '';
                        $.each(e,function(n,o){
                            var selected = (o.id && o.id==valueId) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('[data-ran="'+ran+'"]').html(h);
                        $('.select').select2();
                        //$('[data-key="'+id+'"]').select2();
                    });
                    return h+'<option>Loading...</option></select>';
                }
                if(td.url){
                   
                    if(val) {
                        h+='<option value="'+val.id+'" selected>'+val.text+'</option>';
                        
                        /*$.each(val,function(i,o){
                            h+='<option value="'+o.id+'" selected>'+o.text+'</option>';
                        });*/
                    }
                    var ret = (td.data) ? td.data+'=data;' : '';
                    
                    return h+"</select><script>$(function(){$('[data-key=\""+td.id+"\"]').select2({ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){"+ret+"return{results:data}}}})});</script>";
                }
               if(val.id && !val.value) val.value = val.id;
               var valueId = val.id;
                $.each(td.options,function(n,o){
                    var value = (typeof o.value !== 'undefined') ? o.value : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                });
                return h+'</select>';
            case 'listBasic':
                h+='<select id="'+td.id+'" data-key="'+td.id+'"  data-type="'+td.type+'" name="'+td.id+'" '+attr+' '+cl+'>';
                var valueId = val;
                $.each(td.options,function(n,o){
                    var value = (typeof o.value !== 'undefined') ? o.value : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                });
                return h+"</select>";
               
            case 'multi':
                var ran = 'multi'+Math.random()*10000;
                h+='<select id="'+td.id+'"  data-ran="'+ran+'"  name="'+td.id+'" '+attr+' '+cl+' multiple>';
                if(td.json){
                   
                    // var selected = (e[td.id].id && e[td.id].id.indexOf(o.id)>=0) ? 'selected' : '';
                    this.loading=1;
                    var ids=[];
                    $.each(val,function(q,id){ids.push(id.id)});
                    pax.ajax(td.json,0,function(e){
                        var h = '';
                        $.each(e,function(n,o){
                            var selected = (ids && ids.indexOf(o.id)>=0) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('[data-ran="'+ran+'"]').html(h);
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
                    var temp = (td.templateResult) ? 'templateResult:'+td.templateResult+',' : '';
                    return h+"</select><script>$(function(){$('#"+td.id+"').select2({"+temp+"ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){return{results:data}}}})});</script>";
                }
               if(!td.options){
                  
                    $.each(val,function(n,o){
                       
                        h+='<option value="'+o+'" selected>'+o+'</option>';
                    });
               } else {
                    $.each(td.options,function(n,o){
                        var selected = (val && val.values && val.values.indexOf(o.value)>=0) ? 'selected' : '';
                        var value = (typeof o.value !== 'undefined') ? o.value : '';
                        h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                    });
               }
                

                return h+'</select>';
            case 'multiBasic':
                h+='<select id="'+td.id+'"  data-type="'+td.type+'"  data-ran="'+ran+'"  name="'+td.id+'" '+attr+' '+cl+' multiple>';
                $.each(val,function(n,o){
                    h+='<option value="'+o+'" selected>'+o+'</option>';
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
					self._set(id,{value:$(o).val(),text:$(o).find('option:selected').html()},obj);
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
}
$search = function(o) {this.init(o);};
$search.prototype = 
{
    el:{
        page:null,
        progress:null,
    },
    html:{
        load:"<tbody><tr><td><p class='pulse center'>LOADING</p></td></tr></tbody>"
    },
    server:"/call/json/crud/search/",
    data:{not:[],must:[],should:[]},
    query:{},
    queryString:"",
    timer:null,
    sort:"created",
    order:"asc",
    total:0,
    max:10,
    page:0,
    hits:0,
    loading:0,
    init: function(o) {
        this.el.page = (o.page) ? o.page : 0;
        this.el.prog= (o.prog) ? o.prog : 0;
        if(o.input) this.setInput(o.input,o.inputCall);
        this.server = (o.url) ? o.url : 0;
        if(o.render) this.render = o.render;
        this.el.table = (o.table) ? o.table : 0;
        this.el.total = (o.total) ? o.total : 0;
        this.frame = (o.frame) ? o.frame : 0;
        this.opt = (o.opt) ? o.opt : 0;
        if(o.start) this.search();
    },
    setInput:function(el,call){
        $(el).unbind('input');
        $(el).bind("input", {
            self: this
        },function( event ) {
            var self = event.data.self;
            var val = $(this).val();
            if(self.queryString==val) return 0;
            clearTimeout(self.timer);
            self.timer = setTimeout(self.inputCall,300,self,val,call);
        });
    },
    inputCall: function(self,val,fun){
        //var self = this;
        var vl = val.toLowerCase().trim();
        var op = "OR";
        if(vl[0]=='"') {
            op="AND";
            vl = vl.split('"').join('');
            vl = vl.split(' ').join('*');
        }
        (vl=="") ? delete self.data['query']: self.data['query'] = vl;
        
        self.page = 0;
        self.queryString = val;
        if(fun) fun();
        self.search();
    },
    search: function(query,max,page,sort,order,after) {
        if(!max) max = this.max;
        if(!page) page = this.page;
        
        if(!sort) sort = this.sort;
        if(!order) order = this.order;
        
        var path = this.server+'/'+max+'/'+page+'/'+order+'/'+sort;
        if(after) path = path+'/'+after;
        this.data = (query) ? query : this.data;
        this.post(path);
    },
    render:function(e){
        if(this.el.total) $(this.el.total).html('Total: '+app.multi.search.hits);
        if(this.el.table) {
            //pax.print(e);
            var frame = (this.frame) ? this.frame : [{id:'name',label:'Name'}];
            var opt = (this.opt) ? this.opt : {};
            var h = pax.rend.table(e.hits,frame,opt);
            $(this.el.table).html(h);
        }
    },
    progFadeIn:function(){
        $('#pace').attr('class','animate');
        //if(this.el.progress) $(this.el.progress).removeClass('fade-out').addClass('fade').show();
    },
    progFadeOut:function(){
        $('#pace').attr('class','');
        //if(this.el.progress) $(this.el.progress).removeClass('fade').addClass('fade-out');
    },
    post:function(path){
        this.progFadeIn();
        var self = this;
        var query = JSON.parse(JSON.stringify(this.data)); //CLONE
        //if(!query.must && this.query.query_string) query.must = [];
        //if(this.query.query_string) query.must.push(self.query);
        
        pax.ajax(path,this.data,function(e){
            //pax.print(e);
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
        //pax.print(e);
        if(!e.error && e.hits.length>0){
            var pageTotal = (e.count<=10000) ? e.count : 10000;
            this.total = Math.ceil(pageTotal/this.max);
            this.hits =e.count;
            this.results = e.hits;
            this.pagination();
            this.render(e);
        } else {
            
            this.total =0;
            this.hits =0;
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
    },
    
}
$pax.prototype.valid = //var $render = function(type) {};
{
    nested:1,
    el:$('body'),
    reg: {
        rule:/^(.+?)\[(.+)\]$/,
		number:/^[0-9]+$/,
		integer:/^\d+(\.\d{1,2})?$/,
		decimal:/^\-?[0-9]*\.?[0-9]+$/,
		email:/\S+@\S+\.\S+/,
		alpha:/^[a-z]+$/i,
		alphaNumeric:/^[a-z0-9]+$/i,
		dash:/^[a-z0-9_\-]+$/i,
		natural:/^[0-9]+$/i,
		naturalzero:/^[1-9][0-9]*$/i,
		ip:/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
		bas64:/[^a-zA-Z0-9\/\+=]/i,
		numericdash:/^[\d\-\s]+$/,
		url:/^(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/,
		credit:/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6011[0-9]{12}|622((12[6-9]|1[3-9][0-9])|([2-8][0-9][0-9])|(9(([0-1][0-9])|(2[0-5]))))[0-9]{10}|64[4-9][0-9]{13}|65[0-9]{14}|3(?:0[0-5]|[68][0-9])[0-9]{11}|3[47][0-9]{13})*$/,
		required:/(^$)|(\s+$)/
	},
	cha: {
		number:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,91,224],
		numberslash:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,191,91,224],
		numberdash:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,189,91,224],
		integer:[8,9,13,17,18,37,38,39,40,49,50,51,52,53,54,55,56,57,91,224],
		decimal:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,188,190,91,224],
		characters:[8,9,13,16,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,189,224],
		file:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,189,190,224],
		numbers:[48,49,50,51,52,53,54,55,56,57],
		onlycharacters:[81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77],
	    alphaNumeric:[49,50,51,52,53,54,55,56,57,48,81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77],
		alphaNumericDash:[49,50,51,52,53,54,55,56,57,48,81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77,189]
	},
    init: function() {
		this.el = $('body');
		this.set();
    },
    set: function () {
        var self = this;
	  	$(this.el).find('input[type="text"]').each(function() {
			if($(this).attr('vkey')) self.addKey($(this));
			if($(this).attr('vsuf')) self.addSuffix($(this));
			if($(this).attr('vpre')) self.addPrefix($(this));
			if($(this).attr('vfoc')) self.addFocus($(this));
		});
	},
	update: function (el) {
	  	$(this.el).find('input[type="text"]').each(function() {
			if($(this).attr('vkey')) self.addKey($(this));
			if($(this).attr('vsuf')) self.addSuffix($(this));
			if($(this).attr('vpre')) self.addPrefix($(this));
			if($(this).attr('vfoc')) self.addFocus($(this));
		});
	},
    addSuffix: function(el) {
        var self = this;
  		$(el).parent().append("<span class='span-valid-suf' style='display:none; max-width:200px; max-height:25px; position:absolute;top:30px; z-index:0; left:0; color:#91a4b2;  padding:0;text-indent:4px;' onclick='$(this).parent().find(\"input\").focus()'>"+$(el).attr('vsuf')+"</span>");
		$(el).on("input focus blur",function(e) {
			var width = self.textWidth($(el).val());
			$(el).parent().find('span.span-valid-suf').css('margin-left',width+'px');
			(width) ? $(el).parent().find('span.span-valid-suf').show() : $(el).parent().find('span.span-valid-suf').hide();
		})
		$(el).trigger("input");
    },
    addPrefix: function(el) {
		$(el).parent().append("<span style='position:absolute;top:23px; left:3px;color:#91a4b2;font-size:14px;font-weight:300;' class='span-valid-pre'>"+$(el).attr('vpre')+"</span>");
		var width = $(el).parent().find('span.span-valid-pre').width()+12;
		$(el).css('padding-left',width+'px');
    },
    addFocus: function(el) {
        var self = this;
        $(el).on('focusout',function(e){self.checkFocus(this)});
	},
	checkFocus:function(el){
		var vl = $(el).val();
		var error = false;
		if($(el).attr('vfoc')=='required' && vl!='') return  this.render(el);
		if(vl=='') return this.render(el,1);
		if(!this.reg[$(el).attr('vfoc')].test(vl)) error = true;
		if(error) {
			this.render(el);
			return 0;
		} else {
			this.render(el,1);
			return 1;
		} 
	},
    addKey: function(el) {
        var self = this;
		var vkey = $(el).attr("vkey");

		if(vkey=='phone') {
			self.phone(el);
			$(el).on("keyup",function(e) {	self.phone(this);	});
			return 0;
		}
		if(vkey=='card') {
            
			this.card(el);
			$(el).on("keyup",function(e) {	self.card(this);	});
			return 0;
		}
		if(vkey=='money') {
            var self = this;
			this.money(el,true);
			$(el).on("keyup",function(e) {	self.money(this);	});
			$(el).on("focusout",function(e) { self.money(this,true);});
			return 0;
		}
		if(vkey=='slug') {
			this.slug(el,true);
			$(el).on("keyup",function(e) {	self.slug(this);	});
			return 0;
		}
  		$(el).on("keydown",function(e) {
			var key = e.keyCode ? e.keyCode : e.which;
			if(key==8) return true;
			if(vkey=='alphaNumericDash') if(e.shiftKey || e.altKey) return false;
			if(vkey=='decimal') {
				if($(el).val().indexOf('.')>-1 && key==190) return false;
			}
			if((e.ctrlKey==false) && (e.altKey==false)) {
				if($(el).attr('vdmax')) {
					if($(el).val().indexOf('.')>-1) {
						if(key==190) return false;
						var dec = $(el).val().toString().split(".")[1].length || 0;
						if(dec>1 && this.cha['numbers'].indexOf(key)!=-1) return false;
					}
				}
				if(vkey=='alphaNumeric' && e.shiftKey) return false;
				return (this.cha[vkey].indexOf(key)!=-1) ? true : false;
			} else {
				if(e.shiftKey || e.altKey) return false;
				return true;
			}
		});
    },
	card: function (el) {
		var card =  $(el).val().replace(/[^0-9]/g, '').slice(0,16);
		var value = card.toString().trim().replace(/^\+/, '');
		city = value.slice(0,4);
		number = value.slice(4,8);
		last = value.slice(8,12);
		last2 = value.slice(12,16);
		var str=city;
		if(number.length) str = city + " "+number;
		if(last.length) str= (city + " "+number+" "+last).trim();
		if(last2.length) str= (city + " "+number+" "+last+' '+last2).trim();

		$(el).val(str);
		(this.reg['credit'].test(card)) ?  this.render(el,1)  : this.render(el);;
        //var length = $(el).val().replace(/[^0-9]/g, '').length;
		//(length==10 || length==0) ?  $(el).removeClass('error')  : $(el).addClass('error');
	},
	phone: function (el) {
        var str = this.formatPhone($(el).val());
		$(el).val(str);
        var length = $(el).val().replace(/[^0-9]/g, '').length;
		(length==10 || length==0) ?  this.render(el,1)  : this.render(el);
    },
    formatPhone:function(s){
        s = s.toString();
        var tel = s.replace(/[^0-9]/g, '').slice(0,10);
		var value = tel.toString().trim().replace(/^\+/, '');
		city = value.slice(0,3);
		number = value.slice(3,6);
		last = value.slice(6,10);
		var str=city;
        if(number.length) str = "(" + city + ") "+number;
        if(last.length) str= ("(" + city + ") " + number+"-"+last).trim();
        return str;
    },
	money:function(el,addDecimal){
		var number =  $(el).val().replace(/[^0-9.]/g, '');
		//number = number.toString().trim().replace(/^\+/, '');
		
		$(el).val(this.mon(number,addDecimal));
    },
    mon:function(n,addDecimal){
        number = n.toString();
        var split = number.split('.');
		dollars = split[0];
		cents = (split[1] || split[1]=='') ? '.'+split[1].slice(0,2) : '';
	    dollars = dollars.split('').reverse().join('').replace(/(\d{3}(?!$))/g, '$1,').split('').reverse().join('');
	   	if(addDecimal && dollars!='') {
			var l = cents.length;
		    if(!l) cents = '.00';
		    if(l==2) cents = cents+'0';
           }
        return dollars+cents;
    },
	slug: function(el) {
		del = '-';
	    var slug = $(el).val().trim() 
	    .toLowerCase() 
	    .replace(/[^a-z0-9]+/g,del) 
	    .replace(/^-+/, '') 
	    .replace(/-+$/, ''); 
		$(el).val(slug)
	},
	clean:{
		numbers:function(str){
			return str.replace(/[^0-9]/g, '').slice(0,10);
		},
		decimal:function(str){
			return str.replace(/[^0-9.]/g, '').slice(0,10);
		}
    },
    data:function(el){
       // alert('get data');
        var self = this;
		var form = (!el) ? $(this.el) : $(el);
		var o = {};
		$($(form).find('select,input,textarea')).each(function(){
            var name = $(this).attr("name");
            if(!name) return;
            var ar = (name.indexOf('[]')>-1) ? 1 : 0;
            if(ar){
                name = name.split('[]')[0];
                if(!o[name]) o[name] = [];
                o[name].push(self.getData(this));
            } else  {
                o[name] = self.getData(this);
            }
		});
		return o;
    },
    dataFormat:function(t,v){
        var self = this;
        if(v=='' || !v) return '';
        if($(t).attr('data-type')=='money') return parseFloat(v.split(',').join(''));
        if($(t).hasClass('datetime')) return moment.utc(v).format('YYYY-MM-DDTHH:mm:ss');
        if($(t).attr('data-type')=='phone') return parseInt(v.replace(/[^0-9]/g, ''));
        return v;
    },
    getData:function(t){
        var self = this;
        var o = {};
        var type = $(t).attr('type');
			var tag = $(t).prop("tagName");
            var name = $(t).attr("name");
           
			
            var val = $(t).val();
            if(val=='') val = null;
			var checked = $(t).prop('checked');
			
			if(tag=='SELECT' && $(t).attr('multiple')) tag='MULTIPLE';
	        if(tag=='INPUT' && type=='checkbox') tag='CHECKBOX';
	        if(tag=='INPUT' && type=='radio') tag='RADIO';
	        if(tag=='INPUT' && type=='button') tag='BUTTON';
	        if(tag=='INPUT' && type=='submit') tag='BUTTON';
           
			switch(tag) {
				case 'INPUT':return self.dataFormat(t,val);
				case 'TEXTAREA':return val;
				case 'CHECKBOX': return (checked) ? 1 : 0;
				case 'RADIO':if(checked){return (self.nested) ? {id:val,text:$(t).parent().text()} : val} break;
				case 'SELECT':
                    if(!val || val=='') return {}; 
                    var txt = $(t).find('option:selected').html(); 
                    if($(t).attr('data-type')=='listBasic') return val;
                    if(!txt) txt=null; return o[name]= (self.nested) ? {id:val,text:txt} : val;
				case 'MULTIPLE':
                    
					if($(t).attr('data-type')=='multiBasic') {
                        o[name] = $(t).val();
                    } else {
                        if(!o[name]) o[name]=[];
						$("option:selected", t).each(function(){
                            var v = $(this).val();
							if(v && v!='' && v!='0') o[name].push({id:v,text:$(this).html()});
						});
                    }
					return o[name];
					
				default:break;
		  }
    },
	dataOLD:function(){
		var obj = {};
		var self = this;
		$('body').find("[name]").each(function(i,o){
			//alert($(this).parent().html())
			var id = $(o).attr('name');
			var tag = $(o).prop("tagName");
			if(tag=='SELECT' && $(o).attr('multiple')) tag='MULTIPLE';
            if(tag=='INPUT' && $(o).attr('type')=='checkbox') tag='CHECKBOX';
            if(tag=='INPUT' && $(o).attr('type')=='radio') tag='RADIO';
            if(tag=='INPUT' && $(o).attr('type')=='button') tag='BUTTON';
			if(tag=='INPUT' && $(o).attr('type')=='submit') tag='BUTTON';
			switch(tag){
                case 'INPUT':case 'TEXTAREA':case 'SELECT':case 'MULTIPLE':
					self._set(id,$(o).val(),obj);
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
    errors: function(el) {
        var errors = false;
        var self = this;
        var elem = (el) ? el : this.el;
  		$(elem).find('select,input,textarea').each(function() {
            var val = $(this).val();
            val = (!val || val=='' || typeof val == undefined) ? 0 : 1;
            //alert(val+' '+$(this).attr('name'));
  		  	if($(this).attr('vreq') && !val) {
				errors = true;
				self.render(this);
		 	} else {
				if($(this).is('[vfoc]')) {
					self.checkFocus(this);
				} else {
					self.render(this,1);
				}
				
			}
		});

		if($(this.el).find('.error').length) errors = true;
		return errors;
		//return (success) ? $(form).submit() : alert('Please fill-in all required fields correctly.');
    },
    textWidth: function(text){
		if(text.length != 0) {
			var size = $(".span-valid-suf").css('font-size');
		    var html = $('<span class="span-valid-suf"  style="font-size:'+size+'; font-family:arial; postion:absolute;width:auto;left:-9999px">' + text+ '</span>');
		    $('body').append(html);
		    var width = html.width();
		    html.remove();
		    return width+20;
	    } else {
	  	    return false;
	    }
	},
	render:function(el,n){
		if(n){
			$(el).parent().removeClass('error')
		} else {
			$(el).parent().addClass('error')
		}
    }
}
    
    

    
