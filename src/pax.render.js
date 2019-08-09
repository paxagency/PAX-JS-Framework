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
}
    
    
