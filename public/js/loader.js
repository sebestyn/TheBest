function loaderShow(){
	$('.container').css('opacity',0.4);
	$('body').append('<div id="loaderDiv"><div class="lds-facebook"><div></div><div></div><div></div></div></div>');
	$('.lds-facebook').show();
	$('.lds-facebook').css('opacity',1);
}

function loaderStop(){
	$('.container').css('opacity',1);
	$('.lds-facebook').hide();
}

