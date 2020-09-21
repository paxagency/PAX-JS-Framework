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
            /*
            $.each(obj,function(i,o) {
                h+="<th>"+o.id+"</th>";
            });*/
          
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
                //if(self.mode) o._source._id =  o._id;
                //o = (self.mode) ? o._source : o; 
                
              
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
                //if(self.mode) o._source._id =  o._id;
                //o = (self.mode) ? o._source : o; 
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
        
        //td.class = (td.class && td.class[0]) ? td.class.push('input') : ['input'];
        td.class.push(td.id);
        td.class.push('input');
       // if(td.type=='body' || td.type=='paragraph') td.class.push('redactor');
        //pax.print(td.class);
       
        //pax.print(td.class);
       
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
                  
                    
                    //return "<input type='hidden' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"'></input><img src=\""+self.fileServer+val+"\" style='max-height:200px;'/>"
                    //$.each(val,function(i,o){val[i]=self.fileServer+o});
                    return "<div id='"+td.id+"'></div><script> $('#"+td.id+"').zoomy(['"+val.join("','")+"'],{});</script>";
               // return "<img  id='"+td.id+"'  src=\""+self.fileServer+val+"\" "+attr+" "+cl+" />";
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
    
    
