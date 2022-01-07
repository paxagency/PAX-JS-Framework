//$pax.prototype.rend = //var $render = function(type) {};
var $rend = 
{
    fileServer:"",
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
        
            $.each(obj[0],function(k,o) {
                h+="<th>"+k+"</th>";
            });
        } else {
            $.each(vars,function(k,v){
                var click = (opt['thClick']) ? "onclick='"+opt['thClick']+"(this)'" : '';
                if(v.thead){
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+v.thead+"</th>";
                } else {
                	var label = (v.thead) ? v.thead : v.label;
                	if(!v.label) label = v.id.split('_').join(' ');
                	label = label.split('.')[0];
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+label+"</th>";
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
					if(v.type) val = self.filter(val,v.type);
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
    filter:function(val,type){
    	var self = this;
    	switch(type){
            case 'text':
            	return val;
            case 'image':
            	return "<img src='"+self.fileServer+val+"'/>";
            case 'date':
            	return self.date.get(val);
            case 'dateMonth':
            	return self.date.getMonth(val);
            case 'fromNow':
            	return self.date.timeFromNow(val);
            default:
            	return val;
        }
    },
    add:function(f,el){
       // alert(JSON.stringify(f));
        var h = this.form({},f,1);
        $('#'+el).append(h);
      // alert(h);
    },
    remove:function(t){
        $(t).parent().remove();
    },
    form:function(data,frame,nest){
        var h= '<ul class="form">';
        var self = this;
        if(!frame){
            frame = [];
            $.each(data,function(k,o){frame.push([{type:'text',label:k,id:k}]);});
        }

        $.each(frame,function(i,row){
            h+='<li>'
            if(row[0].type=='group') {
                var fr = JSON.stringify(row[0].frame);
                var id = self.genId();
                h+=`<div data-type="${row[0].type}" data-id='${row[0].id}' name='${row[0].id}' id='${row[0].id}-${id}'>`;
                h+=`<label class="label">${row[0].label} <a onclick='$rend.add(${fr},"${row[0].id}-${id}")'>+</a></label> <div class='form-container'>`;
                $.each(data[row[0].id],function(z,drow){
                    var q = self.form(drow,row[0].frame,row[0].id);
                    h+=self.form(drow,row[0].frame,1);
                });
                h+='</div></div>';
            } else {
                $.each(row,function(n,td){
                    var val = data[td.id] ?? '';
                    var id = self.genId();
                    var label= (td.label) ? td.label : "";
                    label= (td.text) ? td.text : "";
                    if(label=="" && td.id) label = td.id.split('_').join(' ');
                    h+=`<div data-type="${td.type}" data-id="${row[0].id}">`;
                    if(td.type!='hidden') h+=`<label for="${td.id}-${id}" class="label" >${label}</label>`;
                    //h+=`<input type="text" name="${td.id}"  id="${td.id}-${id}"  value="${val}"/>`;
                    h+=self.vewType(td,data,td.id+'-'+id,nest);
                    h+=`</div>`;
                });
            }
            
            h+='</li>'
        });
        if(nest) h+="<a onclick='$rend.remove(this)'  class='form-group-remove rotate45'>+</a>";
        return h+'</ul>';
    },
    genId: function(){
        n = Math.random().toString(36).substring(4);
        return n+String(Date.now());
    },
    autoGrow:function(){
    	$("textarea").css('overflow', 'hidden').keyup(function(e) {
			$rend.growText(this);
		}).each(function(){
			$rend.growText(this);
		});
    },
    growText:function(t){
    	 $(t).height(30);
   		 $(t).height(t.scrollHeight + parseFloat($(t).css("borderTopWidth")) + parseFloat($(t).css("borderBottomWidth")));
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
        this.data[id].push({});
        pax.print(pax.rend.data);
        var h = this.form(this.data,this.frame);
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
    vewType:function(td,e,name,nest){
        var self = this;
        val = this._get(td.id,e);
        if(td.val) val = td.val;
        if(td.call) val = this.call(val,td.call);
        
        var self = this;
        var h = attr = cl='';
        if(td.attr) $.each(td.attr,function(k,o){attr+=k+"='"+o+"' ";});
        if(td.required) attr+="vreq='1' ";
        if(!td.class || typeof td.class!='object') td.class = [];
        
        td.class.push(name);
        td.class.push('input');
        if(!val && td.default) val = td.default;
        if(val==null) val = '';
        
        cl='class="'+td.class.join(' ')+'"';
 
        switch(td.type){
            case 'text':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";
            case 'date':
            	val = $rend.filter(val,'date');
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='date'>";
            
            case 'id':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='alphaNumericDash'>";
                case 'number':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='decimal'>";
                case 'money':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+parseInt(val)/100+"\"' "+attr+" "+cl+" vkey='money' vpre='$'>";
                case 'phone':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='phone'>";
                case 'email':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='email' vfoc='email'>";
                case 'image':
                   
                    var h ="<div class='input image_upload'>";
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
                        return h+inputs+"</span>"+images+"</span><br /><input type='file' ></div>";
                    }
                  
                    
                    //return "<input type='hidden' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"'></input><img src=\""+self.fileServer+val+"\" style='max-height:200px;'/>"
                    //$.each(val,function(i,o){val[i]=self.fileServer+o});
                    return "<div id='"+td.id+"'></div><script> $(function(){$('#"+td.id+"').zoomy(['"+val.join("','")+"'],{})));</script>";
               // return "<img  id='"+td.id+"'  src=\""+self.fileServer+val+"\" "+attr+" "+cl+" />";
		   case 'table':
			   return "<table class='list'>"+self.table(val)+"<table>";
            case 'password':
                return "<input type='password' data-type='"+td.type+"' name='"+td.id+"'  id='"+name+"' value='"+val+"' "+attr+" "+cl+">";
            case 'title':
                return '<h1>'+title+'</h1>';
            case 'html':
                return td.html;
            case 'file':
                 var h = "<div class=' input'>";
                 if(val) h+="<a href='"+val+"'><div class='jam jam-document'></div></a>"
                 return h+="<input  type='file'/></div>";
                 
            case 'textarea':case 'body':
                return "<textarea type='text' name='"+td.id+"' id='"+name+"' "+attr+" "+cl+">"+val+"</textarea>";
            case 'hidden':
                return "<input data-type='"+td.type+"' type='hidden' id='"+name+"' name='"+td.id+"' value='"+val+"'>";
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
                h='<span class="input">';
                if(td.options) {
                    $.each(td.options,function(i,o) {
                        var val = (e[o.id]) ? e[o.id] : 0;
                        var checke = (parseInt(val)) ? 'checked' : '';
                        if(!e[o.id] && o.default) 
                        checke = 'checked';
                        attr=cl='';
                        var label = (o.text) ? o.text : td.id.split("_").join(" ");
                        if(o.attr) $.each(o.attr,function(k,a){attr+=k+"='"+a+"' ";})
                        if(o.class) cl='class="',$.each(o.class,function(i,c){cl+=c+" ";}),cl+='"';
                        h+="<label><input type='checkbox' name='"+o.id+"' value='1' "+attr+" "+cl+" "+checke+"> "+label+"</label>";
                    });
                    return h+'</span>';
                } else {
                    var checked = (val==1 || val==true) ? 'checked' : '';
                    var label = (td.ch_label) ? td.ch_label : td.text;
                	if(!label) label = td.id.split("_").join(" ");
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
            case 'object': 
            	//return self.viewType({id:td.id,type:"select",ajax:"/api/crud/select/"+td.id},e,name);
            	td.type = "select";
            	td.ajax = "/api/crud/select/"+td.id;
            case 'select2':
            	var ran = 'list'+Math.random()*10000;
                h+='<select id="'+name+'"data-ran="'+ran+'" data-key="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'>';
            	if(val) h+='<option value="'+val.id+'" selected>'+val.text+'</option>';
                var ret = (td.data) ? td.data+'=data;' : '';
                return h+"</select><script>$(function(){$('[data-key=\""+td.id+"\"]').select2({ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){"+ret+"return{results:data}}}})});</script>";
            case 'select':
            	var id = td.id;
             	var valueId = (val.id) ? val.id : val;
                h+='<select id="'+name+'" data-key="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'><option disabled selected value> </option>';
                if(td.ajax){
                    $.get(td.ajax).done(function(e) {
                    	e = JSON.parse(e);
                        var html = '<option disabled selected value> </option>';
                        $.each(e,function(n,o){
                            var selected = (o.id && o.id==valueId) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            html+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('#'+name).html(html);
                        $('#'+name).trigger("change");
                    });
                    return h+'<option disabled value selected>Loading...</option></select>';
                }
                $.each(td.options,function(n,o){
                    var value = (typeof o.id !== 'undefined') ? o.id : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                });
                return h+'</select>';
            case 'objects': 
            	//return self.viewType({id:td.id,type:"select",ajax:"/api/crud/select/"+td.id},e,name);
            	td.type = "multiple";
            	//td.ajax = "/api/crud/select/"+td.id;
           		td.selectAjax = true;
            case 'multiple':
            	var ids=[];
                $.each(val,function(q,id){ids.push(id.id)});
                h+='<select id="'+name+'" name="'+td.id+'" '+attr+' '+cl+' multiple>';
               
                if(td.ajax){
                   	$.get(td.ajax).done(function(e) {
						e = JSON.parse(e);
						var html = '';
                        $.each(e,function(n,o){
                            var selected = (ids && ids.indexOf(o.id)>=0) ? 'selected' : '';
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            html+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('#'+name).html(html);
                        $('#'+name).trigger("change");
					});
                    return h+'<option disabled value>Loading...</option></select>';
                }
                $.each(td.options,function(n,o){
					var selected = (val && val.values && val.values.indexOf(o.id)>=0) ? 'selected' : '';
					var value = (typeof o.id !== 'undefined') ? o.id : '';
					h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
				});
				if(td.selectAjax) {
					setTimeout(function(){
						
						$('#'+name).selectAjax({template:"${name}",ajax:"/api/crud/keyword/"+td.id});
					},100);
					
				}
                return h+'</select>';
            case 'list':
                h+='<select id="'+name+'"data-key="'+td.id+'"  data-type="'+td.type+'" name="'+td.id+'" '+attr+' '+cl+'>';
                var valueId = val;
                $.each(td.options,function(n,o){
                    var value = (typeof o.value !== 'undefined') ? o.value : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                });
                return h+"</select>";
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
        // alert('get data');
         var self = this;
         var form = (!el) ? $(this.el) : $(el);
         var o = {};
        
         $(el+' > ul > li').each(function(){
            var t = $(this).find('div:first-child').attr('data-type');
            if(t=='group'){
                var parent = $(this).find('div:first-child').attr("name");
                o[parent] = [];
                $(this).find('ul').each(function(x,q){
                    var o2 = {};
                    $($(this).find('select,input,textarea')).each(function(){
                        var name = $(this).attr("name");
                        o2[name] = self.getData(this);
                    });
                    o[parent].push(o2);
                });
            } else {
                $($(this).find('select,input,textarea')).each(function(){
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
            }
         });
         
        
         return o ; 
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
                    //if(!txt) txt=null; return o[name]= (self.nested) ? {id:val,text:txt} : val;
                    if(!txt) txt=null; return o[name]=  {id:val,text:txt};
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
    data2:function(el){
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
    tableBasic:function(obj,vars,key) {
		var self = this;
		if(!key) key = "id"; 
		if(!obj.length)  return  "<table><tbody><tr id='tr-0'><td style='text-align:center;'>There are no results</td></tr></tbody></table>";
		var h = "<table><tbody>";
		if(!vars){
			$.each(obj,function(i,o) {
				var id = (o[key]) ? "data-id='"+o[key]+"'" : i;
				h+="<tr "+id+" data-index='"+i+"'>";
				$.each(o,function(i,v){
					h+= (v!=null) ? "<td>"+v+"</td>" : "<td></td>";
				});
				h+="</tr>";
			});
		} else {
			$.each(obj,function(i,o) {
				var id = (o[key]) ? "data-id='"+o[key]+"'" : i;
				h+="<tr "+id+" data-index='"+i+"'>";
				$.each(vars,function(n,k){
					var val = self._get(k,o);
					h+= (val!=null) ? "<td>"+val+"</td>" : "<td></td>";
				});
				h+="</tr>";
			});
		}
		return h+"</tbody></table>";
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
    date:{
        now:function(d){
      		return this.date.get();
        },
        unix:function(d){
            return (d) ?  new Date(d+"Z").now() : new Date().now();
        },
        get:function(d){
        	d = (d) ? new Date(d+"Z") : new Date();
            return this.format.month(d.getMonth())+'/'+this.format.date(d.getDate())+"/"+d.getFullYear();
        },
        getMonth:function(d){
			d = (d) ? new Date(d+"Z") : new Date();
            return this.format.month(d.getMonth())+"/"+d.getFullYear().toString().substr(-2);
        },
        getTime:function(d){
        	d = (d) ? new Date(d+"Z") : new Date();
            return this.format.month(d.getMonth())+'/'+this.format.date(d.getDate())+"/"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes();
        },
        stamp:function(d){
        	d = (d) ? new Date(d+"Z") : new Date();
            return d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate()+"T"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
        },
        format:{
        	month:function(m) {
        		m++;
        		return (m.toString().length==1) ? '0'+m : m;
        	},
        	date:function(d) {
        		return (d.toString().length==1) ? '0'+d : d;
        	}
        },
        timeFromNow:function (d) {

			// Get timestamps
			let unixTime = new Date(d+"Z").getTime();
			if (!unixTime) return;
			let now = new Date().getTime();

			// Calculate difference
			let difference = (unixTime / 1000) - (now / 1000);

			// Setup return object
			let tfn = {};

			// Check if time is in the past, present, or future
			tfn.when = 'now';
			if (difference > 0) {
				tfn.when = 'future';
			} else if (difference < -1) {
				tfn.when = 'past';
			}

			// Convert difference to absolute
			difference = Math.abs(difference);

			// Calculate time unit
			if (difference / (60 * 60 * 24 * 365) > 1) {
				// Years
				tfn.unitOfTime = 'years';
				tfn.time = Math.floor(difference / (60 * 60 * 24 * 365));
			} else if (difference / (60 * 60 * 24 * 45) > 1) {
				// Months
				tfn.unitOfTime = 'months';
				tfn.time = Math.floor(difference / (60 * 60 * 24 * 45));
			} else if (difference / (60 * 60 * 24) > 1) {
				// Days
				tfn.unitOfTime = 'days';
				tfn.time = Math.floor(difference / (60 * 60 * 24));
			} else if (difference / (60 * 60) > 1) {
				// Hours
				tfn.unitOfTime = 'hours';
				tfn.time = Math.floor(difference / (60 * 60));
			} else {
				// Seconds
				tfn.unitOfTime = 'minutes';
				tfn.time = Math.floor(difference / 60);
			}
			//alert(JSON.stringify(tfn));
			// Return time from now data
			if(tfn.time<2) tfn.unitOfTime = tfn.unitOfTime.slice(0, -1);
			return (tfn.when=='past') ? tfn.time+' '+tfn.unitOfTime+' ago' : 'In '+tfn.time+' '+tfn.unitOfTime;
	
		}
    },
}
    
    

    
