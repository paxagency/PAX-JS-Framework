$valid = //var $render = function(type) {};
{
    nested:1,
    el:'body',
    fixTop:20,
    fixSize:"14px",
    fixColor:"#91a4b2",
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
		email:[8,9,13,16,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,189,224,190],
		file:[8,9,13,17,18,37,38,39,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,189,190,224],
		numbers:[48,49,50,51,52,53,54,55,56,57],
		onlycharacters:[81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77],
	    alphaNumeric:[49,50,51,52,53,54,55,56,57,48,81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77],
		alphaNumericDash:[49,50,51,52,53,54,55,56,57,48,81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77,189]
	},
    init: function(el) {
		this.el = (el) ? el : this.el;
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
    addSuffix: function(el) {
        var self = this;
  		$(el).parent().append("<span class='span-valid-suf' style='display:none; max-width:200px;  position:absolute; z-index:0; top:"+self.fixTop+"px;left:0; color:"+this.fixColor+";font-size:"+this.fixSize+";text-indent:4px;' onclick='$(this).parent().find(\"input\").focus()'>"+$(el).attr('vsuf')+"</span>");
		$(el).on("input focus blur",function(e) {
			var width = self.textWidth($(el).val());
			$(el).parent().find('span.span-valid-suf').css('margin-left',width+'px');
			(width) ? $(el).parent().find('span.span-valid-suf').show() : $(el).parent().find('span.span-valid-suf').hide();
		})
		$(el).trigger("input");
    },
    addPrefix: function(el) {
		$(el).parent().append("<span style='position:absolute;top:"+this.fixTop+"px; left:5px;color:"+this.fixColor+";font-size:"+this.fixSize+";font-weight:300;' class='span-valid-pre'>"+$(el).attr('vpre')+"</span>");
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
		if(vkey=='date') {
            var self = this;
			$(el).on("keyup",function(e) {	self.date(this,e);	});
			$(el).on("focusout",function(e) { self.date(this,true);});
			$(el).attr('placeholder','MM/DD/YYYY');
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
						if(dec>1 && self.cha['numbers'].indexOf(key)!=-1) return false;
					}
				}
				if(vkey=='alphaNumeric' && e.shiftKey) return false;
				return (self.cha[vkey].indexOf(key)!=-1) ? true : false;
			} else {
				if(e.shiftKey || e.altKey) return false;
				return true;
			}
		});
    },
    date:function (el,e) {
    	var key = e.keyCode ? e.keyCode : e.which;
    	var v = $(el).val();
    	var preL = v.length;
    	var num =  v.replace(/[^0-9]/g, '').toString();
    	var l = num.length;
    	
		if(l<3) {
			num = ((l==2 && key!=8) || preL==3) ? num+"/" : num;
			$(el).val(num);
		} else if(l>2 && l<5) {
			num = ((l==4 && key!=8) || preL==6) ? num.slice(0,2)+"/"+num.slice(2,4)+"/" : num.slice(0,2)+"/"+num.slice(2,4);
			$(el).val(num);
		} else if(l>4) {
			$(el).val(num.slice(0,2)+"/"+num.slice(2,4)+"/"+num.slice(4,8));
		}
		
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
		var number =  $(el).val().replace(/[^0-9.]/g, '').toString();
		var split = number.split('.');
		dollars = split[0];
		cents = (split[1] || split[1]=='') ? '.'+split[1].slice(0,2) : '';
	    dollars = dollars.split('').reverse().join('').replace(/(\d{3}(?!$))/g, '$1,').split('').reverse().join('');
	   	if(addDecimal && dollars!='') {
			var l = cents.length;
		    if(!l) cents = '.00';
		    if(l==2) cents = cents+'0';
        }
		$(el).val(dollars+cents);
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
    data:function(el,nest){
       // alert('get data');
        var self = this;
		var form = (!el) ? $(this.el) : $(el);
		var o = {};
		if(self.errors(el)) return {errors:true};
		$(form).find("[data-type='group']").each(function(){
			var id = $(this).data('id');
			o[id] = [];
			$(this).find("ul.form").each(function(){
				o[id].push(self.data($(this),true));
			});
		});
		$($(form).find('select,input,textarea')).each(function(){
            var name = $(this).attr("name");
            if(!name || $(this).attr("data-ignore")) return;
            if(nest) $(this).attr("data-ignore","1");
            var ar = (name.indexOf('[]')>-1) ? 1 : 0;
            if(ar){
                name = name.split('[]')[0];
                if(!o[name]) o[name] = [];
                o[name].push(self.getData(this));
            } else  {
            	//if($(this).attr('vreq') && val=="") return 
                o[name] = self.getData(this);
            }
		});
		return o;
    },
    dataFormat:function(t,v){
        var self = this;
        if(v=='' || !v) return '';
        if($(t).attr('vkey')=='money') return parseFloat(v.split(',').join(''));
        //if($(t).attr('vkey')=='datetime')) return self.stamp(v);
        if($(t).attr('vkey')=='phone') return parseInt(v.replace(/[^0-9]/g, ''));
        return v;
    },
    stamp:function(d){
		d = (d) ? new Date(d) : new Date();
		return d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate()+"T"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
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
			$(el).removeClass('error');
			$(el).parent().find('label > span').remove();
		} else {
			$(el).addClass('error')
			$(el).parent().find('label').append(" <b>(Required)</b>");
		}
    }
}
    
    
