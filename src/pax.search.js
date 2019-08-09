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
    },
    
}
    
    
