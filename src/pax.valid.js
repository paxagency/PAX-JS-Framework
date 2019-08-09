$pax.prototype.valid = //var $render = function(type) {};
{
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
		$valid.el = $('body');
		$valid.set();
    },
    set: function () {
	  	$($valid.el).find('input[type="text"]').each(function() {
			if($(this).attr('vkey')) $valid.addKey($(this));
			if($(this).attr('vsuf')) $valid.addSuffix($(this));
			if($(this).attr('vpre')) $valid.addPrefix($(this));
			if($(this).attr('vfoc')) $valid.addFocus($(this));
		});
	},
	update: function (el) {
	  	$($valid.el).find('input[type="text"]').each(function() {
			if($(this).attr('vkey')) $valid.addKey($(this));
			if($(this).attr('vsuf')) $valid.addSuffix($(this));
			if($(this).attr('vpre')) $valid.addPrefix($(this));
			if($(this).attr('vfoc')) $valid.addFocus($(this));
		});
	},
    addSuffix: function(el) {
  		$(el).parent().append("<span class='span-valid-suf' style='display:none; max-width:200px; max-height:25px; position:absolute;top:30px; z-index:0; left:0; color:#91a4b2;  padding:0;text-indent:4px;' onclick='$(this).parent().find(\"input\").focus()'>"+$(el).attr('vsuf')+"</span>");
		$(el).on("input focus blur",function(e) {
			var width = $valid.textWidth($(el).val());
			$(el).parent().find('span.span-valid-suf').css('margin-left',width+'px');
			(width) ? $(el).parent().find('span.span-valid-suf').show() : $(el).parent().find('span.span-valid-suf').hide();
		})
		$(el).trigger("input");
    },
    addPrefix: function(el) {
		$(el).parent().append("<span style='position:absolute;top:30px; left:7px;color:#91a4b2;' class='span-valid-pre'>"+$(el).attr('vpre')+"</span>");
		var width = $(el).parent().find('span.span-valid-pre').width()+12;
		$(el).css('padding-left',width+'px');
    },
    addFocus: function(el) {
        $(el).on('focusout',function(e){$valid.checkFocus(this)});
	},
	checkFocus:function(el){
		var vl = $(el).val();
		var error = false;
		if($(el).attr('vfoc')=='required' && vl!='') return  $valid.render(el);
		if(vl=='') return $valid.render(el,1);
		if(!$valid.reg[$(el).attr('vfoc')].test(vl)) error = true;
		if(error) {
			$valid.render(el);
			return 0;
		} else {
			$valid.render(el,1);
			return 1;
		} 
	},
    addKey: function(el) {
		var vkey = $(el).attr("vkey");

		if(vkey=='phone') {
			$valid.phone(el);
			$(el).on("keyup",function(e) {	$valid.phone(this);	});
			return 0;
		}
		if(vkey=='card') {
			$valid.card(el);
			$(el).on("keyup",function(e) {	$valid.card(this);	});
			return 0;
		}
		if(vkey=='money') {
			$valid.money(el,true);
			$(el).on("keyup",function(e) {	$valid.money(this);	});
			$(el).on("focusout",function(e) { $valid.money(this,true);});
			return 0;
		}
		if(vkey=='slug') {
			$valid.slug(el,true);
			$(el).on("keyup",function(e) {	$valid.slug(this);	});
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
						if(dec>1 && $valid.cha['numbers'].indexOf(key)!=-1) return false;
					}
				}
				if(vkey=='alphaNumeric' && e.shiftKey) return false;
				return ($valid.cha[vkey].indexOf(key)!=-1) ? true : false;
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
		($valid.reg['credit'].test(card)) ?  $valid.render(el,1)  : $valid.render(el);;
        //var length = $(el).val().replace(/[^0-9]/g, '').length;
		//(length==10 || length==0) ?  $(el).removeClass('error')  : $(el).addClass('error');
	},
	phone: function (el) {
		var tel =  $(el).val().replace(/[^0-9]/g, '').slice(0,10);
		var value = tel.toString().trim().replace(/^\+/, '');
		city = value.slice(0,3);
		number = value.slice(3,6);
		last = value.slice(6,10);
		var str=city;
		if(number.length) str = "(" + city + ") "+number;
		if(last.length) str= ("(" + city + ") " + number+"-"+last).trim()

		$(el).val(str);
        var length = $(el).val().replace(/[^0-9]/g, '').length;
		(length==10 || length==0) ?  $valid.render(el,1)  : $valid.render(el);
	},
	money:function(el,addDecimal){
		var number =  $(el).val().replace(/[^0-9.]/g, '');
		//number = number.toString().trim().replace(/^\+/, '');
		var split = number.split('.');
		dollars = split[0];
		cents = (split[1] || split[1]=='') ? '.'+split[1].slice(0,2) : '';
	    dollars = dollars.split('').reverse().join('').replace(/(\d{3}(?!$))/g, '$1,').split('').reverse().join('');
	   	if(addDecimal && dollars!='') {
			var l = cents.length;
		    if(!l) cents = '.00';
		    if(l==2) cents = cents+'0';
	   	}
		$(el).val(dollars+cents)
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
	data:function(){
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
		/*var tag = $(o).prop("tagName");
			var id = $(o).attr('name');
			if(tag=='SELECT' && $(o).attr('multiple')) tag='MULTIPLE';
            if(tag=='INPUT' && $(o).attr('type')=='checkbox') tag='CHECKBOX';
            if(tag=='INPUT' && $(o).attr('type')=='radio') tag='RADIO';
            if(tag=='INPUT' && $(o).attr('type')=='button') tag='BUTTON';
			if(tag=='INPUT' && $(o).attr('type')=='submit') tag='BUTTON';
			switch(tag){
                case 'INPUT':
					obj[id] = $(o).val();
                break;
                break;case 'RADIO':
                    if(self.val[id] || self.val[id]==0) $(o).val([self.val[id]]);
                    $(self.el[id]).on('change',{self:self},function(e){e.data.self.update(id)})
                break;
                case 'CHECKBOX':
                    (self.val[id]) ? $(o).prop("checked",true) : self.val[id]=0;
                    $(self.el[id]).on('change',{self:self},function(e){e.data.self.update(id)})
                break;
                case 'TEXTAREA':
                    (self.val[id]) ? $(o).val(self.val[id]) : self.val[id] = self.numString($(o).val());
                    $(self.el[id]).on('focusout',{self:self},function(e){e.data.self.update(id)})
                break;
                case 'SELECT':
                    (self.val[id] || self.val[id]==0) ? $(o).find('option[value="'+self.val[id]+'"]').prop("selected",true) : self.val[id] = self.numString($(o).val());
                    $(self.el[id]).on('change',{self:self},function(e){e.data.self.update(id)})
                break;
                case 'MULTIPLE':
                    (self.val[id] || self.val[id]==0) ? $(o).val(self.val[id]) : self.val[id] = $(o).val();
                    $(self.el[id]).on('change',{self:self},function(e){e.data.self.update(id)})
                break;
                default:
                    //(self.val[id]) ? $(o).html(self.render(id)) : self.val[id] = $(o).html();
            }*/
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
    errors: function(form) {
  		var errors = false;
  		$($valid.el).find('input').each(function() {
  		  	if($(this).attr('vreq') && $(this).val()=='') {
				errors = true;
				$valid.render(this);
		 	} else {
				if($(this).is('[vfoc]')) {
					$valid.checkFocus(this);
				} else {
					$valid.render(this,1);
				}
				
			}
		});

		if($($valid.el).find('.error').length) errors = true;
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
    
    
