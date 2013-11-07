$(document).ready(function() {

	var head_slider = $('#bg-hold');
	var head_slides = $('#bg-hold li');
	var head_slideLength = head_slides.length;
	var head_currentIndex = 1;
	var head_nextIndex = 1;
	var head_duration = 800;
	var head_controls = $('#head_controls');
	var head_controlWidth = head_slideLength * 19;
	var head_titleList = $('#container-home #title');
	var head_titles = $('li',head_titleList);
	var head_animating = false;
	var head_controlsActive = false;
	
	//INITIATE SLIDESHOW
	head_slides.css('opacity', 0);
	$('li:nth-child('+head_nextIndex+')',head_slider).addClass('show').css('opacity',1);
	
	//INITIATE TITLES
	head_titles.css({'width':'100%','position':'relative','right':5,'bottom':5,'font-size':'15px','opacity':0});
	$('li:nth-child('+head_nextIndex+')',head_titleList).addClass('show').css('opacity',1);
	
	//INITIATE CONTROLS
	if(head_controlsActive){
		head_controls.css({'width': head_controlWidth,'margin':'0 auto 4.875em'});
		$('#home .container_main').css('padding','1.625em 0 4.875em');
		for(c=0; c<head_slideLength; c++){
			if(c==0){
				classAdd = 'active';
			}else{
				classAdd = '';
			}
			head_controls.append('<a id="'+c+'_hs" class="'+classAdd+'"></a>');
		}
	
		//SLIDESHOW CONTROL
		var head_controlLink = $('#head_controls a');
		head_controlLink.click(function(){
			click_newIndex = parseInt($(this).attr('id').split("_")[0]);
			click_currentIndex = $('li.show', head_slider).index();
			if(click_currentIndex == click_newIndex){return;}else{
				clearInterval(head_play);
				hslide_move(click_newIndex+1);
				head_automate();
			}
		});
	}
	
	//SLIDESHOW MOVEMENT
	hslide_move = function(request){
		if(!head_animating){
			head_animating = true;
			if(!request){
				head_nextIndex = head_currentIndex+1;
				if(head_nextIndex > head_slideLength){
					head_nextIndex = 1;
				}
			}else{
				head_nextIndex = request;
			}
			$('li:nth-child('+head_nextIndex+')',head_slider).addClass('show').animate({'opacity':1},head_duration);
			$('li:nth-child('+head_currentIndex+')',head_slider).removeClass('show').animate({'opacity':0},head_duration,function(){head_animating=false;});
			$('li:nth-child('+head_nextIndex+')',head_titleList).show().addClass('show').animate({'opacity':1},head_duration);
			$('li:nth-child('+head_currentIndex+')',head_titleList).hide().removeClass('show').animate({'opacity':0},head_duration);
			//$('.active',head_controls).removeClass('active');
			//$('#'+(head_nextIndex-1)+'_hs').addClass('active');
			head_currentIndex = head_nextIndex;
		}else{return;}
	}
	
	head_automate = function(){
		head_play = setInterval(function(){hslide_move();},7000);
	}
	head_automate();
	
	$('li',head_titleList).hide();
	$('li:nth-child(1)',head_titleList).show();
});