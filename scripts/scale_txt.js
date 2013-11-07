// JavaScript Document

$( document ).ready( function() {
            var $body = $('body'); //Cache this for performance

            var setBodyScale = function() {
                var scaleSource = $body.width(),
                    scaleFactor = 0.07,                    maxScale = 125,
                    minScale = 85; //Tweak these values to taste

                var fontSize = scaleSource * scaleFactor; //Multiply the width of the body by the scaling factor:

                if (fontSize > maxScale) fontSize = maxScale;
                if (fontSize < minScale) fontSize = minScale; //Enforce the minimum and maximums

                $('body').css('font-size', fontSize + '%');
            }

            $(window).resize(function(){
                setBodyScale();
            });

            //Fire it when the page first loads:
            setBodyScale();
        });