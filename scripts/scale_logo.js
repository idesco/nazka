// JavaScript Document

$( document ).ready( function() {
            var $logo = $('#logo a img'); //Cache this for performance

            var setLogoWidth = function() {
                var scaleSource = $body.width(),
                    scaleFactor = 0.20,                    
					maxWidth = 100,
                    minWidth = 30; //Tweak these values to taste

                var logoWidth = scaleSource * scaleFactor; //Multiply the width of the body by the scaling factor:

                if (LogoWidth > maxWidth) LogoWidth = maxWidth;
                if (LogoWidth < minWidth) LogoWidth = minWidth; //Enforce the minimum and maximums

                $('logo a img').css('width', width + '%');
            }

            $(window).resize(function(){
                setBodyScale();
            });

            //Fire it when the page first loads:
            setLogoWidth();
        });