
function MainView(){
	this.newTransbtn = $('.float-nav');
	this.animationD = 250,
	this.cancelbtn = $('#cancelTans'),
	this.clearbtn = $('#clearbtn'),
	this.transPage = $('#trans')
	this.activityPage = $('#history')
	this.detailsPage = $('#details')
	this.pageWidth = this.activityPage.width()
	this.navtitle = $('#title')
	this.transForm = $('.holder form')
	this.backButton = $('.fa-arrow-left')
	this.currentView = this.activityPage
	this.previousView = null;
	this._init();
	this.actionBar = false
}

MainView.prototype =  {
	_init :function(){
		this._initEvents()

	},
	_initEvents :function(){
		self = this

		this.newTransbtn.on("click", function(){ 
			console.log(self.actionBar)
			if(self.actionBar){
				self.openModel()
			}
			else{
				self.openMenu()
			}
		   	$(this).toggleClass('closed');
		   	
		});
		this.cancelbtn.click(function(e){
			e.stopPropagation();
			self.toActivity()
			self.closeMenu()
		})
		this.clearbtn.click(function(e){
			e.stopPropagation();
			self.clearForms()	
		})
		this.backButton.click(function(e){
			e.stopPropagation();
			self.navigate(self.currentView, self.previousView)
			self.backButton.hide()
		})
	},
	openMenu: function(){
		this.navigate(self.activityPage, self.transPage)
		this.actionBar = true;
	},
	openModel: function(){
		this.actionBar = false
		transferView.showModal();
	},
	closeMenu: function(){
		this.actionBar = false;
		this.newTransbtn.addClass('closed')
	},
	clearForms: function(){
		this.transForm.find("input[type=radio], input[type=text], textarea").val("");
		$('.option-input').prop('checked', false);
		transferView.vemail = false;
		transferView.vamount = false;
	},
	navigate :function(from, to){
		var self = this
		this.previousView = from
		this.currentView = to
		from.children('.holder').fadeOut(100)

		from.animate({
		   width: 0
		}, { duration: self.animationD, queue: false });
		to.animate({
		   width: self.pageWidth
		}, 
		{ 
			duration: self.animationD, 
			queue: false,
			complete: function(){
				to.children('.holder').fadeIn(100)
			}
		 });
		self.backButton.show()
		if(to === this.activityPage ){
			self.navtitle.text('Activity')
			this.closeMenu()
		}
		else if(to === this.detailsPage ){
			self.navtitle.text('Details')
			this.closeMenu()
		}
		else if(to === this.transPage ){
			self.navtitle.text('New Transfer')
		}
		
	},
	toDetails: function(){
		this.navigate(this.currentView, this.detailsPage)
	},
	toActivity:function(){
		this.navigate(this.currentView, this.activityPage)
	}
};



//autoComplete View
var AutoCompleteView = Backbone.View.extend({
	el:'.contactAutoCom',
	data:null,
	events: {
		"click li": "clicked"
	},
	clicked: function(e){
		var email = $(e.currentTarget).data("email")
		$(this.input).val(email)
		transferView.validateEmail()
		this.close()

	},
	initialize: function () {
		this.input = $('.title-input')
		var self = this
		$('.title-input').keyup(function(key) {
			var code = key.which;
    		if(code==13){self.close()}
    		else{
				delay(function() {
					if(self.input.val().length > 0){
						self.render(self.input.val())
					}
				},500)
			}
		})

		$(document).mouseup(function (e)
		{
			var container = $(".contactAutoCom");
		    if (!container.is(e.target)
		        && container.has(e.target).length === 0) 
		    {
		    	container.html('');
		    }
		});

	},
	close: function(){
	  this.$el.html('')
	},
	render : function(v){
		var self = this
		$.ajax({
			method: "GET",
			url: "http://localhost:3000/search/user/"+v,
		})
		.done(function(data){
			self.data = data
			var template = _.template($('#autoComplete-template').html())
			self.$el.html(template({users: data}));
		})
	}
})


//New Trans Screen
var TransferView = Backbone.View.extend({
	el:'#trans',
	amount: $('.amount-input'),
	cType :$('.currency-select'),
	data:null,
	vemail:false,
	vamount:false,
	initialize: function () {
		var confirmationDetailsView = new ConfirmationDetailsView({model:confirmationModal})
		var autoCompleteView = new AutoCompleteView()
		var self = this

		this.amount.change(function() {
			self.formatCurrency()
		})
		this.cType.change(function(){
			self.formatCurrency()
		})
		$('.title-input').change(function(){
			self.validateEmail()
		})
	},
	validateEmail: function(){
		el = $('.title-input')
		var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		console.log($(el).val())
		if(!re.test($(el).val())){
			$('.title-input').css('color','red')
			this.vemail = false;
		}
		else{
			$('.title-input').css('color','black')
			this.vemail = true;
		}
	},
	showModal : function(){
		//get the data, cannot do form submit because of custom elements
		var to = $('.title-input').val()
		var amount = $('.amount-input').val()
		var currency = $('.currency-select').val()
		var notes = $("#msg").val()
		var type = $("input:radio[name=type]:checked").val()
		//since the user is in another collection and they are connected to a trans by _id, we have to try to match
		//the to field to a email in user collection, if not available, try to make a user object.
		//but for this assignment, I'm just going to post data directly to the Trans collections.
		if (type !== 'undefined' && this.vamount && this.vemail) {
			this.data = {to: to, type: type, notes:notes, amount:amount, currency:currency, status:0 , user_id:'551e7e40e9f2e963af22bcc9'},
			console.log(this.data)
			confirmationModal.set(this.data)
			$('body').addClass('overlay');
			$('.modal').fadeIn();
			$('#loaderG').hide();
			$('.content').show()
		}
		else{
			mainView.actionBar = true
			$('.float-nav').toggleClass('closed');
			alert('Please fill all required fields')
		}
	},
	formatCurrency: function(){
		var toType = this.cType.val();
		var fromType = this.amount.attr('data-currencyformat');
		var value = this.amount.val()
		var od = null
		var ot = null
		var nd = null
		var nt = null


		
		if(/^[0-9.,]+$/.test(value)){
			this.amount.css('color','black')
			this.vamount = true;
			if (toType == 'EUR'){
				nd = ','
				nt = '.'
			}
			else{
				nd = '.'
				nt = ','
			}
			if (fromType == 'EUR'){
				od = /,/g
				ot = /\./g
			}
			else{
				od = /\./g
				ot = /,/g
			}

			value = value.replace(ot, "")
			value = parseFloat(value.replace(od, ".")).toFixed(2)
			var split =value.split(".")
			split[0] = split[0].replace(/(\d)(?=(\d{3})+$)/g, '$1'+nt);
			if(toType == 'JPN'){
				this.amount.val(split[0])
			}
			else{
				this.amount.val(split.join(nd))
			}
			this.amount.attr({'data-currencyformat':toType})
		}
		else{
			this.vamount = false
			this.amount.css('color','red')
		}

	}
})


//Confirmation Screen
var ConfirmationModal = Backbone.Model.extend();

var confirmationModal = new ConfirmationModal()
var ConfirmationDetailsView = Backbone.View.extend({
	el:'.content',
	loader: $('#loaderG'),
	modal :$('.modal'),
	mcontent: $('.modal .content'),
	sendButton: $('.sendButton'),

	initialize: function () {
		this.model.on('change', this.render, this);
	},
	render: function(){
		var self = this;
		console.log(this.model)
		var template = _.template($('#modal-template').html())
		this.$el.html(template({transfer:this.model}));
		var self = this
		$('.fa.fa-times').click(function(){
			$('body').removeClass('overlay');
			self.modal.fadeOut();
			self.mcontent.fadeIn()
			self.loader.hide()
		})
		$('.button.cancel').click(function(){
			$('body').removeClass('overlay');
			self.modal.fadeOut();
			self.mcontent.fadeIn()
			$(".float-nav").trigger('click')
			self.loader.hide()
		})
		$('.button.submit').click(function(){
			self.loader.show()
			self.mcontent.hide()
			self.sendButton.css('background-color','#1565C0')
			self.sendButton.removeClass('done')
			self.sendButton.addClass('loading')
			//make the request
			//Just a dummy delay to embhazie on animation... WILL BE ROMOVED in prod.
			delay(function() {
					self.submitTrans()
			},500)
		})
	},
	submitTrans : function(){
		var self = this;
		console.log(transferView.data)
		$.ajax({
			method: "POST",
			url: "http://localhost:3000/activity",
			data: transferView.data
		}).done(function(res){
			self.sendButton.css('background-color','#1565C0');
			self.sendButton.removeClass('loading')
			self.sendButton.addClass('done')

			// add that to activity activity-list
			activities.add(res, {at:0})

			//again just a delay to emphazie on amimation
			delay(function() {
					$('body').removeClass('overlay');
					$('.modal').fadeOut();
					mainView.toActivity()
					mainView.clearForms()
			},500)

		}).fail(function(e) {
    		alert( "error" );
    		console.log(e)
 		})
	}
})

//Details Screen
var TransferDetails = Backbone.Model.extend();
var DetailsView = Backbone.View.extend({
	el:'#details',
	initialize: function () {
		this.model.on('change', this.render, this);
	},
	render: function(){
		// console.log(this.model)
		var template = _.template($('#details-template').html())
		this.$el.html(template({details: this.model}));
		$('.notify').click(function(){
			$(this).toggleClass('fa-toggle-off')
			$(this).toggleClass('fa-toggle-on')
		})
	}
})

//ACtivity Screen
var Activities = Backbone.Collection.extend({
	url: '/activity'
});
var Activity = Backbone.Model.extend();



var ActivityView = Backbone.View.extend({
	el: '#scrollPanel',
	transferDetails: null,
	detailsView: null,
	events: {
		"click li": "clicked"
	},
	initialize:function(){
		activities.on("change", this.appendNew);
	},
	clicked: function(e){
		var theChosenOne = activities.at($(e.currentTarget).data("id"))
		var self = this
		$.ajax({
			method: "GET",
			url: "http://localhost:3000/details/"+theChosenOne.get('_id'),
		})
		.done(function(data){
			if(data.status == 0){data.status = 'Complete'}
			else if(data.status == 1){data.status = 'Uncleared'}
			else if(data.status == 2){data.status = 'Cancelled'}
			self.transferDetails.set(data)
			mainView.toDetails()
		})
	},
	render : function(){
		var self = this
		this.transferDetails = new TransferDetails()
		this.detailsView = new DetailsView({model:this.transferDetails})
		activities.fetch({
			success: function (users) {
				$(self.el).html('')
				users.forEach(function(m,i){
		            self.appendList(m,i)
		        });
			}
		})
	},
	appendList: function(modal,i){
		var template = _.template($('#activity-list-template').html())
		var ren_template = template({activitiy: modal, i:i})
		$('#scrollPanel').append(ren_template)
	},
	appendNew: function(modal,c){
		var template = _.template($('#activity-list-template').html())
		var ren_template = template({activitiy: modal, i:c.length})
		$('#scrollPanel').append(ren_template)
	}

})

var activities = new Activities();
var activityView = new ActivityView()
var transferView = new TransferView()
var mainView = new MainView()


//router stuff
var Router = Backbone.Router.extend({
	routes:{
		'':'home'
	}
})
var router = new Router()
router.on('route:home', function(){
	activityView.render()
})

Backbone.history.start()


//***********UTILITY FUNCTIONS***********//
var delay = (function() {
		var timer = 0;
		return function(callback, ms) {
				clearTimeout(timer);
				timer = setTimeout(callback, ms);
		};
})();