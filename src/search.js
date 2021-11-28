$search = function(o) {this.init(o);};
$search.prototype = 
{
    el:{
        page:"#pages",
        //progress:"#progress",
        //total:"#total"
    },
    server:"/api/crud/search/",
    url:"/blog",
    setPath:true,
    data:{not:[],must:[],should:[]},
    query:{},
    queryString:"",
    timer:null,
    sort:"created",
    order:"asc",
    key:"user",
    total:0,
    max:10,
    page:0,
    after:0,
    hits:0,
    loading:0,
    init: function(o) {
    	if(o) {
			this.el.page = (o.page) ? o.page : this.el.page;
			this.el.progress= (o.prog) ? o.prog : this.el.prog;
			if(o.input) this.setInput(o.input,o.inputCall);
			this.server = (o.url) ? o.url : this.server;
			this.key = (o.key) ? o.key : this.key;
			if(o.render) this.render = o.render;
			this.el.table = (o.table) ? o.table : 0;
			this.el.total = (o.total) ? o.total : 0;
			this.frame = (o.frame) ? o.frame : 0;
			this.opt = (o.opt) ? o.opt : 0;
        }
        this.server += this.key;
        if(this.setPath) this.getPath();
        this.search();
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
    search: function(query) {
        this.loadIn();
        var path = this.server+'/'+this.max+'/'+this.page+'/'+this.order+'/'+this.sort;
        if(this.after) path = path+'/'+after;
        this.data = (query) ? query : this.data;
        this.ajax(path);
    },
    render:function(e){
        if(this.el.total) $(this.el.total).html('Total: '+app.multi.search.hits);
        if(this.el.table) {
            var frame = (this.frame) ? this.frame : [{id:'name',label:'Name'}];
            var opt = (this.opt) ? this.opt : {};
            var h = pax.rend.table(e.hits,frame,opt);
            $(this.el.table).html(h);
        }
    },
    loadIn:function() {
        if(this.el.loader) {
        	$(this.el.loader).attr("style","transition: opacity 0.3s;opacity:0;");
        	$(this.el.loader).css("opacity","1");
        }
    },
    loadOut:function() {
        if(this.el.loader) $(this.el.loader).css("opacity","0");
    },
    ajax:function(path){
        this.loadIn();
        var self = this;
        var query = JSON.parse(JSON.stringify(this.data)); //CLONE        
        pax.ajax(path,this.data,function(e){
           // pax.print(e);
            self.loadOut();
            if(e.error){
                self.sort = '_id';
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
        if(this.setPath) this.path();
        this.search();
    },
    setSort:function(sort){
        this.order = (this.order=='asc') ? 'desc' : 'asc';
        this.sort = sort;
        this.page=0;
        if(this.setPath) this.path();
        this.search();
    },
    elSort:function(t){
        this.setSort($(t).attr('data-id'));
    },
    path:function(){
    	var url = this.url+"/"+this.page;
    	if(this.sort!="created") url+="/"+this.sort;
		if(this.order!="asc") url+="/"+this.order;
		window.history.pushState(url,url,url);
    },
    getPath:function(){	
		var vars = window.location.pathname.split(this.url+"/");
		if(vars[1]) {
			vars = vars[1].split("/");
			if(vars[0]) this.page = vars[0];
			if(vars[1]) this.sort = vars[1];
			if(vars[2]) this.order = vars[2];
		}
    }
}
    
    
