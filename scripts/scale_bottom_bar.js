// JavaScript Document

$( document ).ready( function() {
            var bottom_bar = $('#bottom-bar'); //Cache this for performance

            var setBottombarScale = function() {
                var scaleSource = $body.width()/$body.height(),
                    scaleFactor = 0.07,                    maxScale = 100,
                    minScale = 50; //Tweak these values to taste

                var maxHeight = scaleSource * scaleFactor; //Multiply the width/height ratio of the body by the scaling factor:

                if (maxHeight > maxScale) maxHeight = maxScale;
                if (maxHeight < minScale) maxHeight = minScale; //Enforce the minimum and maximums

                $('#bottom-bar').css('max-height', maxHeight + '%');
            }

            $(window).resize(function(){
                setBottombarScale();
            });

            //Fire it when the page first loads:
            setBottombarScale();
        });