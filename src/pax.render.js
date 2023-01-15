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
    table:function(obj,vars,opt,edit) {
        var self = this;
        if(!opt) opt = {};
        var h = "<thead><tr>";
      
        if(!vars){
        
            $.each(obj[0],function(k,o) {
                h+="<th>"+k.split("_").join(" ")+"</th>";
            });
        } else {
            $.each(vars,function(k,v){
                var click = (opt['thClick']) ? "onclick='"+opt['thClick']+"(this)'" : '';
                if(v.thead){
                    h+="<th "+click+" data-id="+v.id+" data-index="+k+">"+v.thead+"</th>";
                } else {
                	var label = (v.thead) ? v.thead : v.label;
                	if(!v.label && v.id) label = v.id.split('_').join(' ');
                	label = (label) ? label.split('.')[0] : "";
                	
                	var sort = (v.sort) ? "data-sort='"+v.sort+"'" : "";
                    h+="<th "+click+" data-id='"+v.id+"' data-index='"+k+"' "+sort+">"+label+"</th>";
                }
            });
        }
       
        h+="</tr></thead><tbody>";
        if(!obj.length)  {
        
        	var message = (opt.no_message) ? "</tbody>" : "<tr id='tr-0'><th  colspan='100%' style='text-align:center;'>There are no results</th></tr></tbody>"; 
        	return  h+message;
		}
        var events = "";
        if(opt["on"]) {
        	$.each(opt["on"],function(event,method){
        		events+=" on"+event+"='"+method+"(this,event) '";
        	});
        }
                
        if(!vars){
        	if(opt.setAttr)  $.each(obj[0],function(i,v){ opt.trAttr.push(i)});
       
            $.each(obj,function(i,o) {
                var id = (o.id) ? "data-id='"+o.id+"'" : "";
                var attr = '';
                if(opt.trAttr) $.each(opt.trAttr, function(i,trK) {attr+=' data-'+trK+'="'+o[trK]+'"'});
               
                h+="<tr "+attr+" "+id+" data-index='"+i+"' "+events+">";
                var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                
                $.each(o,function(i,v){
                    h+= (v!=null) ? "<td "+click+" data-id='"+i+"'>"+v+"</td>" : "<td></td>";
                });
                h+="</tr>";
            });
            return h+"</tbody>";
        } else {
        	if(!opt.trAttr) opt.trAttr = [];
           if(opt.setAttr)  $.each(vars,function(i,v){ if(v.id) opt.trAttr.push(v.id)});
           
       		//if(!obj.length) return  h+"</tbody>";
       		
            $.each(obj,function(i,o) {
           
                var attr = '';
                if(opt.trAttr) $.each(opt.trAttr,function(i,trK) {
					var v = self._get(trK,o);
					trK = trK.split('.').join("-");
					attr+=' data-'+trK+'="'+v+'"'}
				);
                var id = (o.id) ? "data-id='"+o.id+"'" : "";
                h+="<tr "+id+" "+attr+"  "+events+" data-index='"+i+"'>";
                
                $.each(vars,function(n,v){
                    var k = v.id;
                   
                    attr = '';
                    if(opt.attr) $.each(opt.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.attr) $.each(v.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.cl) attr+=" class='",$.each(v.cl,function(q,cl) {attr+=" "+cl+" "}),attr+="'";
                    
                    var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                    if(v['tdClick']) click="onclick='"+v['tdClick']+"(this)'";
                  
                    var val = (v.val) ? self.temp(v.val,o) : self._get(k,o);
                    if(v.key) val = v.key[val];
                    if(v.ids) {
                        $.each(v.ids,function(x,ids){
                            val+=" "+self._get(ids,o);
                        });
                    }
                    
                    if(v.call) val = self.call(val,v.call);
                    
                    if(!v.type) {
                    	v.type = "text";
                    	
                    	if(val && val.constructor === Array)  v.type = "objects";
                    	if(val && val.constructor === Object)  v.type = "object";
                    	if(v.type=="text" && val && val[4]=="-"  && val[7]=="-" && val[10]=="T") v.type = "date";
						//if(typeof val === 'string') 
                    }
                    var a_v =  "";
                    var a_t =  "";
                    if(opt["attributes"]) {
                    	
                    	var a_val = (typeof val === "object") ? JSON.stringify(val) : val;
                    	a_v = (opt["attributes"]) ? "data-val='"+a_val+"'" : "";
                   		 a_t = (opt["attributes"]) ? "data-type='"+v.type+"'" : "";
                    
                    }
                    
					if(v.type) val = self.filter(val,v.type);
					if(edit) {
						var e = {};
						e[v.id] = val;
						
						
					    val=self.vewType(v,e);
					}
					
					var d_id = (v.id) ? `data-id='${v.id}'` : '';
					
                    h+= (val!=null) ? "<td "+click+" "+attr+" "+d_id+" "+a_v+" "+a_t+">"+val+"</td>" : "<td "+click+" "+attr+"></td>";
                });
                h+="</tr>";
            });
            return h+"</tbody>";
        }
    },
    tableRow:function(o,vars,opt) {
    	if(!opt) opt = {};
    	var self = this;
    	var attr = '';
    	if(!opt.trAttr) opt.trAttr = [];
        if(opt.setAttr)  $.each(vars,function(i,v){ if(v.id) opt.trAttr.push(v.id)});

        if(opt.trAttr) $.each(opt.trAttr,function(i,trK) {
        	var v = self._get(trK,o);
        	trK = trK.split('.').join("-");
        	attr+=' data-'+trK+'="'+v+'"'}
        );
        var id = (o.id) ? "data-id='"+o.id+"'" : ""; 
     	var h="<tr "+id+" "+attr+" >";
                $.each(vars,function(n,v){
                    var k = v.id;
                    attr = '';
                    if(opt.attr) $.each(opt.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.attr) $.each(v.attr,function(attr_k,attr_v) {attr+=' data-'+attr_k+'="'+attr_v+'"'});
                    if(v.cl) attr+=" class='",$.each(v.cl,function(q,cl) {attr+=" "+cl+" "}),attr+="'";
                    
                    var click = (opt['tdClick']) ? "onclick='"+opt['tdClick']+"(this)'" : '';
                    if(v['tdClick']) click="onclick='"+v['tdClick']+"(this)'";
                    
                    var val = (v.val) ? v.val : self._get(k,o);
                    if(v.key) val = v.key[val];
                    if(v.ids) {
                        $.each(v.ids,function(x,ids){
                            val+=" "+self._get(ids,o);
                        });
                    }
                    if(!v.type) {
                    	v.type = "text";
                    	
                    	if(val && val.constructor === Array)  v.type = "objects";
                    	if(val && val.constructor === Object)  v.type = "object";
                    	if(v.type=="text" && val && val[4]=="-"  && val[7]=="-" && val[10]=="T") v.type = "date";
						//if(typeof val === 'string') 
                    }
                    if(v.call) val = self.call(val,v.call);
					if(v.type) val = self.filter(val,v.type);
					
					var d_id = (v.id) ? `data-id='${v.id}'` : '';
					
                    h+= (val!=null) ? "<td "+click+" "+attr+" "+d_id+">"+val+"</td>" : "<td "+click+" "+attr+"></td>";
                });
                return h+="</tr>";

    },
    tableRow1:function(obj,vars,opt) {
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
            case 'objects':
            	return val.map(function(val){
   					 return val.text;
				}).join(",");
            case 'object':
            	return val.text || "";
            case 'image':
            	return "<img src='"+val+"'/>";
            case 'date':
            	return app.glob.date.get(val);
            case 'datetime':
            	return app.glob.date.getTime(val);
            case 'dateMonth':
            	return app.glob.date.get(val,"MM/YY");
            case 'fromNow':
            	return app.glob.date.now(val);
            case 'checkbox':
            	return (val) ? "Yes" : "No";
            case 'money':
            	return self.money(val);
            default:
            	return val;
        }
    },
    money:function(s){
    	s = parseInt(s)/100;
    	s= String(s);
    	if(s=="") return 0;
    	addDecimal = true;
		var number =  s.replace(/[^0-9.]/g, '').toString();
		var split = number.split('.');
		dollars = split[0];
		cents = (split[1] || split[1]=='') ? '.'+split[1].slice(0,2) : '';
	    dollars = dollars.split('').reverse().join('').replace(/(\d{3}(?!$))/g, '$1,').split('').reverse().join('');
	   	if(addDecimal && dollars!='') {
			var l = cents.length;
		    if(!l) cents = '.00';
		    if(l==2) cents = cents+'0';
        }
		return "$"+dollars+cents;
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
    formSide:function(e,opt){
        var h='';
        var self = this;
        
        if(!opt){
            opt = [];
            $.each(e,function(k,o){
                opt.push({label:k,fields:[{type:'text',id:k}]});
            });
        }
        $.each(opt,function(i,row){
            h+="<tr data-key='"+i+"' class='row"+i+"'><td>"+row.label+"</td><td>";
            var count = row.fields.length;
            var width  = 100/count;
            $.each(row.fields,function(n,td){
            	if(width<100) {
            		if(!td.attr) td.attr = {};
            		var marg = (n) ? "margin-left:1%;" : "";
            		var w = (n) ? width-1 : width;
            		//if(!td.attr.style) td.attr.style="";
            		//td.attr.style+= "width:"+w+"%;"+marg;
            	}
                h+=self.renderRow(td,e,self,"","NO");
            });
            h+="</td></tr>";
        });
        return "<table class='form-side'><tbody>"+h+"</tbody></table>";
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
                h+=`<label class="label">${row[0].label} <a class='a-group-add' onclick='$rend.add(${fr},"${row[0].id}-${id}")'>+</a></label> <div class='form-container'>`;
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
                    if(!td.type && td.html) td.type = "html";
                    if(!td.type) td.type = "text";
                    if(label=="" && td.id) label = td.id.split('_').join(' ');
                    h+=`<div data-type="${td.type}" data-id="${td.id}">`;
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
       // pax.print(pax.rend.data);
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
            	//val = $rend.filter(val,'date');
                //return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='date'>";
            	td.class.push("date");
            	val = self.filter(val,"date");
            	cl='class="'+td.class.join(' ')+'"';
            	return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";
				case 'datetime':
            	//val = $rend.filter(val,'date');
                //return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='date'>";
            	td.class.push("datetime");
            	cl='class="'+td.class.join(' ')+'"';
            	
            	val = self.filter(val,"datetime");
            
            	return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";
				case 'dateMonth':
            	//val = $rend.filter(val,'date');
                //return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='date'>";
            	td.class.push("dateMonth");
            	cl='class="'+td.class.join(' ')+'"';
            	
            	val = self.filter(val,"dateMonth");
            
            	return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+">";

            	case 'id':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='alphaNumericDash'>";
                case 'url':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='alphaNumericSlash'>";
               
                case 'number':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='decimal'>";
                case 'money':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+parseInt(val)/100+"\"' "+attr+" "+cl+" vkey='money' vpre='$'>";
                case 'phone':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='phone'>";
                case 'email':
                return "<input type='text' data-type='"+td.type+"' id='"+name+"' name='"+td.id+"' value=\""+val+"\"' "+attr+" "+cl+" vkey='email' vfoc='email'>";
                /*case 'image':
                    var attr = (td.width) ? "data-width='"+td.width+"' " : "";
                    if(td.height) attr+="data-height='"+td.height+"' ";
                    if(td.thumb) attr+="data-thumb='"+td.thumb+"' ";
                    if(td.query) attr+="data-query='"+td.query+"' ";
                    if(td.orientation) attr+="data-orientation='"+td.orientation+"' ";
                    var h ="<div class='input image_upload' "+attr+" data-id='"+td.id+"'><div class='progress' style='display:none;'><div class='progress-bar w3'> <div class='progress-text'></div></div></div>";
                    if(!val) return h+'<span class="inputs"></span><span class="images"></span><br /><input type="file"></input></p>';
                    if( typeof val !='object') {
                        return h+"<span class='inputs'><input type='hidden' data-type='"+td.type+"' id='"+td.id+"' name='"+td.id+"' value=\""+val+"\"'></input></span><span class='images'><img src=\""+val+"\" style='max-height:200px;'/></span><br /><input type='file' ></p>"
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
			
					*/

		   case 'table':
			   return "<table class='list'>"+self.table(val)+"<table>";
            
            case 'password':
                return "<input type='password' data-type='"+td.type+"' name='"+td.id+"'  id='"+name+"' value='"+val+"' "+attr+" "+cl+">";
            case 'title':
                return '<h1>'+title+'</h1>';
            case 'html':
                return self.temp(td.html,e);
           /* case 'file':
                 var h = "<div class=' input'><span class='images'>";
                 if(val) {
                     var split = val.split("/");
                     name = split[split.length-1];
                     h+="<h4><a href='"+val+"' target='_blank'><span class='jam-document jam'></span><br/><span class='icon-name'>"+name+"</span></a></h4>"
                 }
                 return h+="</span><span class='inputs'></span><input  type='file'/></div>";
			*/
            case 'file':
            	td.multipe=0;
            	td.featured=0;
            	td.type="files";
            case 'image':
            	if(td.type=="image") {
					td.multipe=0;
					td.featured=1;
					td.accept = '.jpg,.png,.gif,.jpeg';
					td.type="files";
            	}
            case 'images':
            	if(td.type=="images") {
            		td.accept = '.jpg,.png,.gif,.jpeg';
            		td.type="files";
            	}
            case 'files':
            	/*val = td.val  = [
						{
							"id":"jlksdfjasdf",
							"text":"deck-color-schemes.pdf",
							"url":"https://www.ebyexteriors.com/wp-content/uploads/2020/03/deck-color-schemes.jpg",
							"ext":"pdf",
							"size":2343,
							"created":"2022-01-01T10:00:00"
						}
					];*/
				var attr = (td.width) ? "data-width='"+td.width+"' " : "";
				if(td.height) attr+="data-height='"+td.height+"' ";
				if(td.thumb) attr+="data-thumb='"+td.thumb+"' ";
				if(td.query) attr+="data-query='"+td.query+"' ";
				if(td.orientation) attr+="data-orientation='"+td.orientation+"' ";
				var input_value = (typeof val === "string") ? val : JSON.stringify(val);
				if(typeof val === "string" || td.string) attr+="data-string='true' ";
                var h = "<div class='input' style='position:relative;' "+attr+"><div class='progress'  style='display:none;'><div class='progress-bar w3'> <div class='progress-text'></div></div></div><input type='hidden' name='"+td.id+"' data-type='files' value='"+input_value+"'/>";
                var centered = (td.featured) ? "files-center" : "";
                h+= '<ul class="files '+centered+'">';
				var file_classes = {
					"jpg":"files-img",
					"png":"files-img",
					"gif":"files-img",
					"jpeg":"files-img",
					"mov":"files-video",
					"mp4":"files-video",
					"avi":"files-video",
					"mkv":"files-video",
					"mp3":"files-audio",
					"wav":"files-audio",
					"aac":"files-audio",
					"ogg":"files-audio"
				};
			
                 if(val) {	
                 	if(typeof val === "string") val = [{url:val}];
                 	$.each(val,function(i,o){
                 		var cl = (file_classes[o.ext]) ? file_classes[o.ext] : "files-file";
                 		if(td.featured) cl = "files-img";
                 		var st = (cl=="files-img") ? "background-image:url("+o.url+");background-size:cover;" : "";
                 		if(!o.text || o.text == "") o.text = o.url;
                 		if(!o.created) o.created = "";
                 		if(!o.size) o.size = "";
                 		if(!o.ext) o.ext = "";
                 		var featured = (td.featured) ? "files-featured" : "";
                    	h+=`<li class='files-item ${featured}' data-created="${o.created}" data-size="${o.size}" data-ext="${o.ext}" data-text="${o.text}"  data-url="${o.url}"  data-id="${o.id}"><a class="${cl}" style='${st}' href="${o.url}" target="_blank" ></a><a  href="${o.url}" target="_blank" class="file-name" >${o.text}</a><span class="file-date">${o.created}</span><a class="file-delete" onclick="app.files.removeItem(this)"></a></li>`;
						
                     	//h+="<a href='"+v.url+"' target='_blank' class='file'><span class='jam-document jam'></span><br/><span class='icon-name'>"+name+"</span></a>"
                 	});
                 }
                 	h+=`<li class="files-upload" onclick="$(this).parent().parent().find('input').trigger('click');"><span class="file-add file-upload">+</span><span class="file-name">Upload File</span><span class="file-date"></span></li>`;
                 	if(td.stock) h+='<li class="files-stock"><span class="file-add file-stock">+</span><span class="file-name">Stock Photos</span><span class="file-date"></span></li>';
					
                 var accept = (td.accept) ? 'accept="'+td.accept+'"' : "";
                 var multiple = (td.multiple) ? "multiple" : ""
                 
                 return h+="</ul><span class='inputs'></span><input  type='file' "+accept+" "+multiple+"/></div>";
            
            case 'textarea':case 'body':
                return "<textarea type='text' name='"+td.id+"' id='"+name+"' "+attr+" "+cl+">"+val+"</textarea>";
            case 'redactor':
                return "<textarea type='text' name='"+td.id+"' id='"+name+"' "+attr+" "+cl+">"+val+"</textarea><script>RedactorX('#"+td.id+"');</script>";
            
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
            	td.type = "keyword";
            	td.url = (td.url) ? td.url : "/api/crud/select/"+td.id;
                
            case 'keyword':
            	 var unique = self.uniqueId();
            	 h+='<select id="'+unique+'"   data-id="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'>';
                 if(td.json){
                    this.loading=1;
                    var valueId = val.id;
                    
                    $.get(td.json).done(function(e) {
                    	e = JSON.parse(e);
                    	var h = '';
                    	
                        $.each(e,function(n,o){
                            var selected = (valueId && o.id && o.id==valueId) ? 'selected' : '';
                            
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                        	var attr2 = $rend.rendAttr(o);
                        	
                            h+='<option value="'+value+'" '+attr2+' '+selected+'>'+o.text+'</option>';
                        });
                      
                        $('#'+unique).html(h);
                        $('#'+unique).keyword();
                     });
                     return h+'</select>';
                }
                if(td.url){
                    if(val) {
                        h+='<option value="'+val.id+'" selected>'+val.text+'</option>';
                    }
                    
                    
                    return h+"</select><script>$(function(){$('#"+unique+"').keyword({url:'"+td.url+"',post_key:'query'})});</script>";
                }
                
                $.each(td.options,function(n,o){
                    
                    var selected = (o.value==val.value) ? 'selected' : '';
                    if(!val.value) selected=(o.value==td.default) ? 'selected' : '';
                    var value = (typeof o.value !== 'undefined') ? o.value : '';
                    var attr2 = $rend.rendAttr(o);
                    h+='<option value="'+value+'" '+attr2+' '+selected+'>'+o.label+'</option>';
                });
                return h+'</select>';
            	/*var ran = 'list'+Math.random()*10000;
                h+='<select id="'+name+'"data-ran="'+ran+'" data-key="'+td.id+'"  name="'+td.id+'" '+attr+' '+cl+'>';
            	if(val) h+='<option value="'+val.id+'" selected>'+val.text+'</option>';
                var ret = (td.data) ? td.data+'=data;' : '';
                return h+"</select><script>$(function(){$('[data-key=\""+td.id+"\"]').select2({ajax:{url: function (params) {return (params.term) ? '"+td.url+"/' + params.term : '"+td.url+"';},delay: 250,dataType:'json',processResults:function(data){"+ret+"return{results:data}}}})});</script>";
                 */       
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
            	td.type = "keywordMultiple";
            	td.url = (td.url) ? td.url : "/api/crud/select/"+td.id;
                td.selectAjax = true;
           	case 'tags': 
            	//return self.viewType({id:td.id,type:"select",ajax:"/api/crud/select/"+td.id},e,name);
            	td.type = "keywordMultiple";
            	td.selectAjax = true;
                td.free_text = true;
           	case 'keywordMultiple':
           		var unique = self.uniqueId();
            	h+='<select id="'+unique+'" data-id="'+td.id+'" name="'+td.id+'" '+attr+' '+cl+' multiple>';
                
                if(td.json){
                    // var selected = (e[td.id].id && e[td.id].id.indexOf(o.id)>=0) ? 'selected' : '';
                   
                    this.loading=1;
                	
                	$.ajax({
						url: td.json,
						type: "GET",
						dataType: "json",
						val: val,
						success: function(e, textStatus, jqXHR) {
							var h = '';
                        	var self = this;
							$.each(e,function(n,o){
								var selected = (val && val.id && val.id.indexOf(o.id)>=0) ? 'selected' : '';
								$.each(self.val,function(i,ob){if(ob.id==o.id) selected='selected'})
								var value = (typeof o.id !== 'undefined') ? o.id : '';
								var attr2 = $rend.rendAttr(o);
								h+='<option value="'+value+'" '+attr2+' '+selected+'>'+o.text+'</option>';
							});
							
							$('#'+unique).html(h);
							var free = (td.free_text) ? 1 : 0;
                    
							$('#'+unique).keyword({free_text:free});
						}
					});

                    /*pax.ajax(td.json,0,function(e){
                        var h = '';
                        pax.print(val);
                        $.each(e,function(n,o){
                            var selected = (val && val.id.indexOf(o.id)>=0) ? 'selected' : '';
                            $.each(val,function(i,ob){if(ob.id==o.id) selected='selected'})
                            var value = (typeof o.id !== 'undefined') ? o.id : '';
                            h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                        });
                        $('#'+td.id).html(h);
                        $('#'+td.id).select2();
                    });*/
                    return h+'</select>';
                }
                if(td.url){
                    if(val) {
                        $.each(val,function(i,o){
                            h+='<option value="'+o.id+'" selected>'+o.text+'</option>';
                        });
                       
                    }
                   
                    var free = (td.free_text) ? ",free_text:1" : "";
                    
                    return h+"</select><script>$(function(){$('#"+unique+"').keyword({url:'"+td.url+"',post_key:'query'"+free+"})});</script>";
                }
             
                $.each(td.options,function(n,o){
                    var selected = (val && val.values && val.values.indexOf(o.value)>=0) ? 'selected' : '';
                    var value = (typeof o.value !== 'undefined') ? o.value : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.label+'</option>';
                });
                return h+'</select>';
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
                h+='<select id="'+name+' "data-key="'+td.id+'"  data-type="'+td.type+'" name="'+td.id+'" '+attr+' '+cl+'>';
                //var valueId = val;
                var valueId = (val.id) ? val.id : val;
             
                $.each(td.options,function(n,o){
                    //var value = (typeof o.value !== 'undefined') ? o.value : n;
                    var value = (typeof o.id !== 'undefined') ? o.id : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                });
                return h+"</select>";
            case 'sort':
            	
            	var h = "<input class='input search-table' /><input  type='hidden' class='input table-key'/><div id='"+name+"-key' class='table-results' style='display:none;position:absolute; width:100%;box-shadow:0px 10px 20px rgba(0,0,0,.1);'></div><input class='input hidden' type='hidden' name='"+td.id+"' data-type='json' value='"+JSON.stringify(val)+"'/><br><div id='"+name+"'></div>";
            	//ADD EDIT REMOVE TO FRAME
				var frame = (td.frame) ? JSON.parse(JSON.stringify(td.frame)) : {};
				//frame.push({cl:["edit"],val:"<a onclick='$rend.sort_edit(this,)' style='display:block;'>&#9998;</a>"});
				frame.push({cl:["remove"],val:"<a onclick='$(this).parent().parent().fadeOut(function(){$rend.sortChange($(this).parent().parent())}).attr(\"data-index\",\"\");' style='display:block;'>&#10005;</a>"});
				frame.unshift({val:"1"});

				
            	if(val.length) {
            		
            		var ids = [];
            		$.each(val,function(i,o){ids.push(o.id)});
            		
            				
            		$.post( "/api/crud/search/"+td.key+"/1000", {ids:ids},
						function(e) {
							e = JSON.parse(e);
							var val2 = [];
							
							if(e.hits.length) {
								var keys = {};
								//SET SORT TO PARENT ORDER
								$.each(e.hits,function(i,o){
									keys[o.id] = o;
								});
								$.each(val,function(i,o){
									if(o.id && keys[o.id]) val2.push(keys[o.id]);
								});
								val = val2;
							}  else {
								val = [];
							}
							
							h= self.table(val,frame,{no_message:1});
							$('#'+name).html("<table class='list hover'>"+h+"</table>");
							$('#'+name+'  tbody').sortable({stop:function(){
								self.sortChange(this);
							}});
							self.sortChange($('#'+name+'  tbody'));
						}
					);
					
					
					 
            	} else {
            		var html = self.table([],frame,{no_message:1});
            		
            		setTimeout(function(){
            			$('#'+name).html("<table class='list hover'>"+html+"</table>");
            			$('#'+name+'  tbody').sortable({stop:function(){
								self.sortChange(this);
							}});
            		},100);
            	}
            	
            	$.post( "/api/crud/search/"+td.key+"/10", {},function(e) {
						e = JSON.parse(e);
						$('#'+name+"-key").parent().find("input.table-key").val(JSON.stringify(e.hits));
						var frame2 = (td.frame) ? td.frame : {};
						h= self.table(e.hits,frame2);
						$('#'+name+"-key").html("<table class='list hover'>"+h+"</table>");
						$('#'+name+'-key  tr').on("mousedown",function(){
							var id = $(this).data('id');
							var index = $(this).data('index');
							var div = $(this).parent().parent().parent().parent();
							var tbody = $('#'+name).find("tbody");
							var o = JSON.parse($(div).find("input.table-key").val());
							
							var h = $rend.tableRow(o[index],frame);
							$(tbody).prepend(h).hide().fadeIn();
							$rend.sortChange(tbody);
						});
					});
					
					
					
					
				setTimeout(function(){
					$("input.search-table").on("focus",function(){
						$(this).parent().find(".table-results").show();	
					});
					$("input.search-table").on("blur",function(){
						$(this).parent().find(".table-results").hide();	
						$(this).val("");
					});
					$("input.search-table").on("keydown",function(){
					
						$(this).attr("data-val",$(this).val());
						$(this).attr("data-time",Date.now());
						
					});
					$("input.search-table").on("input",function(){
						var time = parseInt($(this).attr("data-time"));
						var el = this;
						setTimeout($rend.sortCall,500,time,td,name);						
					});
				},100);
				 return h;
           
            case 'timeline':
            	h+='<div class="input center"><select onchange="$rend.timelineChange(this)" id="'+name+'"data-key="'+td.id+'"  data-type="'+td.type+'" name="'+td.id+'" '+attr+' >';
                //var valueId = val;
                var valueId = (val.id) ? val.id : val;
             	td.options.push({id:'cancel',"text":"Canceled"})
                $.each(td.options,function(n,o){
                    //var value = (typeof o.value !== 'undefined') ? o.value : n;
                    var value = (typeof o.id !== 'undefined') ? o.id : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+o.text+'</option>';
                });
                
			   return h+'</select><br><br><table class="timeline">'+self.timeline(td.options,val)+"</table></div>";
            case 'listBasic':
                h+='<select id="'+name+'"data-key="'+td.id+'"  data-type="'+td.type+'" name="'+td.id+'" '+attr+' '+cl+'>';
                var valueId = val;
                $.each(td.options,function(n,o){
                    var value = (typeof o.id !== 'undefined') ? o.id : n;
                    var selected = (value==valueId) ? 'selected' : '';
                    var txt = (o.text) ? o.text : o.id.split('_').join(' ');
                    if(!valueId) selected=(value==td.default) ? 'selected' : '';
                    h+='<option value="'+value+'" '+selected+'>'+txt+'</option>';
                });
                return h+"</select>";
            
            
            default:
                return td.html;
        }
    },
    sortCall:function(time,td,name){
    	var el = $('#'+name+"-key").parent().find("input.search-table");
   		var time2 = parseInt($(el).attr("data-time"));
   		var self = this;
		if(time==time2) {
			var frame = (td.frame) ? JSON.parse(JSON.stringify(td.frame)) : {};
				//frame.push({cl:["edit"],val:"<a onclick='$rend.sort_edit(this,)' style='display:block;'>&#9998;</a>"});
				frame.push({cl:["remove"],val:"<a onclick='$(this).parent().parent().fadeOut(function(){$rend.sortChange($(this).parent().parent())}).attr(\"data-index\",\"\");' style='display:block;'>&#10005;</a>"});
				frame.unshift({val:"1"});

			$.post( "/api/crud/search/"+td.key+"/10", {query:$(el).attr("data-val")},function(e) {
						
						e = JSON.parse(e);
						$('#'+name+"-key").parent().find("input.table-key").val(JSON.stringify(e.hits));
						var frame2 = (td.frame) ? td.frame : {};
						h= $rend.table(e.hits,frame2);
						$('#'+name+"-key").html("<table class='list hover'>"+h+"</table>");
						$('#'+name+'-key  tr').on("mousedown",function(){
							var id = $(this).data('id');
							var index = $(this).data('index');
							var div = $(this).parent().parent().parent().parent();
							var tbody = $('#'+name).find("tbody");
							var o = JSON.parse($(div).find("input.table-key").val());
							var h = $rend.tableRow(o[index],frame);
							$(tbody).prepend(h).hide().fadeIn();
							$rend.sortChange(tbody);
						});
					});
		}
    },
    sortChange:function(t){
    	var self = this;
    	var data = [];	
    	var text_key = "name";
    	var n = 1;
    	
    	var total = $(t).find("tr").length;
    	$(t).find("tr").each(function(i,o){
			var id =$(this).data('id');
			if(id && $(this).css('display')!='none') {	
				var obj = {
					'id':id,
					'text':$(this).find("[data-id='"+text_key+"']").text()
				};
				
				var img = $(this).find("[data-id='image']");
				if($(img).length) obj.image = $(img).find("img").attr("src");
				data.push(obj);
				$(this).find("td:first-child").html(self.rendSelect(n,total));
				$(this).attr("data-index",n);
				n++;
			}
		});
		$(t).parent().parent().parent().find("input[class='input hidden']").val(JSON.stringify(data));
				

    },
    rendSelect:function(v,total){
		var h = "<select class='number' onchange='$rend.reOrder(this)'>";
		for (let i = 1; i < total+1; i++) { 
		    var select = (v==i) ? "selected" : "";
			h+="<option value='"+i+"' "+select+">"+i+"</option>"
		}
		
		return h+"</select>";
	},
	reOrder:function(t){
		var val = parseInt($(t).val());
		var index = parseInt($(t).parent().parent().attr("data-index"));
		var rows = $(t).parent().parent().parent();
		
		
		if(val>index) {
			$(rows).find("tr[data-index='"+val+"']").after($(t).parent().parent());
		} else {
			$(rows).find("tr[data-index='"+val+"']").before($(t).parent().parent());
		}
		
		//this.reIndex();
		//alert($(t).parent().parent().parent().html())
		this.sortChange(rows);
	},
    timeline:function(options,values){
    	
    	//{"event":{"created":"2022-01-01","user":{"id":"id","text":"User"}}}
    	/*values = {
    		active:"estimate",
    		created:{"created":"2022-01-01","user":{"id":"id","text":"User"}},
    		estimate:{"created":"2022-01-01","user":{"id":"id","text":"User"}},
    		cancel:{"created":"2022-01-01","user":{"id":"id","text":"User"}}
    	};*/
    	/*values = {
    		text:"new",
    		id:"new",
    		feed:{
    			"new":{"updated":"2022-01-01","user":{"id":"id","text":"User"}}
    		}
    	};*/
    	
    	var h = '<thead><tr>';
    	var b = "";
    	if(!values || !values.id) values = {id:options[0].id,text:options[0].text};
    	if(!values.feed || !values.feed[values.id])  {
    		values.feed = {};
    		values.feed[values.id] = {updated:this.date.stamp(),user:{text:config.user.text,id:config.user.id}};
    	}
    	var canceled = (values.id=="cancel") ? 1 : 0;
    	var canceledSet = 0;
    	var active = 1;
    	
    	var self = this;
    	$(options).each(function(i,o){
    		var next = options[i+1];
    		var active = (next && next.id && values[next.id]) ? 0 : 1;
    		var txt = (o.text) ? o.text : o.id.split("_").join(" ");
    		var id = (o.id) ? o.id : o.id.split(" ").join("_");
    		var selected = (values && values.id && values.id==id) ? "selected" : ""; 
    		
    		
    		if(values.feed[id]) {
    			var cl = (active && !canceled) ? "active" : "done";
    			var content = self.date.get(values.feed[id].updated)+'<br>'+values.feed[id].user.text;
    			content = "";
    			h+='<td class="'+cl+' '+id+'">'+txt+'<span class="m-content">'+content+'</span></td>';
    			b+='<td class="'+cl+' '+id+'">'+content+'</td>';
    		} /*else if(canceled && !canceledSet) {
    			var content = values.feed["cancel"].updated+'<br>'+values.feed["cancel"].user.text;
    			content = "";
    			h+='<td class="canceled '+id+'">Canceled</td><td>'+txt+'<span class="m-content">'+content+'</span></td>';
    			b+='<td class="canceled" '+id+'>'+content+'</td><td></td>';
    			canceledSet = 1;
    		} */ else {
    			h+='<td class="'+id+'">'+txt+'</td>';
    			b+='<td class="'+id+'"></td>';
    		}
    	});
    	
    
    	return  h+"</tr></thead><tbody><tr>"+b+"</tr></tbody>";
    },
    timelineChange:function(t){
    	var id = $(t).parent().parent().data("id");
    	//$(t).val();
    	var values ={id:$(t).val(),text:$(t).find("option:selected").html()};
    	var options = [];
    	$(t).find("option").each(function(){
    		options.push({id:$(this).val(),text:$(this).html()});
    	});
    	
    	$(t).parent().find(".timeline").html(this.timeline(options,values));
    },
    rendAttr:function(o){
		var attr = "";
		$.each(o,function(k,b){
			attr+=" data-"+k+"='"+b+"'";
		});
		
		return attr;
	},
	getAttr:function(el){
		var o = {};
		var tag = $(el).prop("tagName");
		for (const a of $(el)[0].attributes) {
			if(a.name.indexOf("data-")>=0){
				k = a.name.slice(5);
				o[k] = a.value;
			}
		 
		}
		return o;
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
        if(Array.isArray(object)){
        	
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
    tableBasic:function(obj,vars,key,tbody) {
		var self = this;
		if(!key) key = "id"; 
		if(!obj.length)  return  "<table><thead><tr id='tr-0'><th style='text-align:center;'>There are no results</th></tr></thead></table>";
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
        	d = this.dateObj(d);
            return d.now();
        },
        get:function(d,s){
        	if(typeof s == "undefined") s = "/";
        	d = this.dateObj(d);
            return this.format.month(d.getMonth())+s+this.format.date(d.getDate())+s+d.getFullYear();
        },
        getMonth:function(d){
			d = this.dateObj(d);
            return this.format.month(d.getMonth())+"/"+d.getFullYear().toString().substr(-2);
        },
        getTime:function(d){
        	d = this.dateObj(d);
            return this.format.month(d.getMonth())+'/'+this.format.date(d.getDate())+"/"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes();
        },
        stamp:function(d){
        	d = this.dateObj(d);
            return d.getUTCFullYear()+"-"+this.format.month(d.getUTCMonth())+"-"+this.format.date(d.getUTCDate())+"T"+this.format.date(d.getUTCHours())+":"+this.format.date(d.getUTCMinutes())+":00";
        },
        dateObj:function(d,loc){
        	if(!d) return new Date();
        	date = new Date(d);
        	if (!date.getTime()) date = new Date(Date.parse(d.split("-").join("/")));
        	//if(!loc) date = date.toUTCString();
        	return date;
        },
        format:{
        	days:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
			months:['January','February','March','April','May','June','July','August','September','October','November','December'],
        	month:function(m) {
        		m++;
        		return (m.toString().length==1) ? '0'+m : m;
        	},
        	date:function(d) {
        		return (d.toString().length==1) ? '0'+d : d;
        	}
        },
        timeFormat:function(d){
			var hours = d.getHours();
			var sym = "AM";
			if(hours>12) {
				hours = hours-12;
				sym= "PM";
			}
			return hours+":"+d.getMinutes()+" "+sym;
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
				if(!tfn.time) tfn.time = 1;
			}
			//alert(JSON.stringify(tfn));
			// Return time from now data
			if(tfn.time<2) tfn.unitOfTime = tfn.unitOfTime.slice(0, -1);
			return (tfn.when=='past') ? tfn.time+' '+tfn.unitOfTime+' ago' : 'In '+tfn.time+' '+tfn.unitOfTime;
	
		},
		tzAbbrOffsets:{  acdt: 37800,  acst: 34200,  addt: -7200,  adt: -10800,  aedt: 39600,  aest: 36000,  ahdt: -32400,  ahst: -36000,  akdt: -28800,  akst: -32400,  amt: -13840,  apt: -10800,  ast: -14400,  awdt: 32400,  awst: 28800,  awt: -10800,  bdst: 7200,  bdt: -36000,  bmt: -14309,  bst: 3600,  cast: 34200,  cat: 7200,  cddt: -14400,  cdt: -18000,  cemt: 10800,  cest: 7200,  cet: 3600,  cmt: -15408,  cpt: -18000,  cst: -21600,  cwt: -18000,  chst: 36000,  dmt: -1521,  eat: 10800,  eddt: -10800,  edt: -14400,  eest: 10800,  eet: 7200,  emt: -26248,  ept: -14400,  est: -18000,  ewt: -14400,  ffmt: -14660,  fmt: -4056,  gdt: 39600,  gmt: 0,  gst: 36000,  hdt: -34200,  hkst: 32400,  hkt: 28800,  hmt: -19776,  hpt: -34200,  hst: -36000,  hwt: -34200,  iddt: 14400,  idt: 10800,  imt: 25025,  ist: 7200,  jdt: 36000,  jmt: 8440,  jst: 32400,  kdt: 36000,  kmt: 5736,  kst: 30600,  lst: 9394,  mddt: -18000,  mdst: 16279,  mdt: -21600,  mest: 7200,  met: 3600,  mmt: 9017,  mpt: -21600,  msd: 14400,  msk: 10800,  mst: -25200,  mwt: -21600,  nddt: -5400,  ndt: -9052,  npt: -9000,  nst: -12600,  nwt: -9000,  nzdt: 46800,  nzmt: 41400,  nzst: 43200,  pddt: -21600,  pdt: -25200,  pkst: 21600,  pkt: 18000,  plmt: 25590,  pmt: -13236,  ppmt: -17340,  ppt: -25200,  pst: -28800,  pwt: -25200,  qmt: -18840,  rmt: 5794,  sast: 7200,  sdmt: -16800,  sjmt: -20173,  smt: -13884,  sst: -39600,  tbmt: 10751,  tmt: 12344,  uct: 0,  utc: 0,  wast: 7200,  wat: 3600,  wemt: 7200,  west: 3600,  wet: 0,  wib: 25200,  wita: 28800,  wit: 32400,  wmt: 5040,  yddt: -25200,  ydt: -28800,  ypt: -28800,  yst: -32400,  ywt: -28800,  a: 3600,  b: 7200,  c: 10800,  d: 14400,  e: 18000,  f: 21600,  g: 25200,  h: 28800,  i: 32400,  k: 36000,  l: 39600,  m: 43200,  n: -3600,  o: -7200,  p: -10800,  q: -14400,  r: -18000,  s: -21600,  t: -25200,  u: -28800,  v: -32400,  w: -36000,  x: -39600,  y: -43200,  z: 0}
		
    },
    uniqueId: function(){
        n = Math.random().toString(36).substring(4);
        return n+String(Date.now());
    },
}
    
    

    
