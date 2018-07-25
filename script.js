/** Rerferences
getUserMedia API used as per definition at 3 Oct 2017
https://www.w3.org/TR/mediacapture-streams/#examples
http://blog.scottlogic.com/2016/01/06/audio-api-with-d3.html
https://www.bignerdranch.com/blog/music-visualization-with-d3-js/
*/
var screenOrientationRatio; 

function start() {
	if(detectIE()){
	    alert('Internet Explorer is not supported at this time. Please re-try with another browser, e.g. Google Chrome.');
	}else{
        var constraints = {
		    audio: true
	    }
    	//browsers are updating security, getUserMedia can only be called from secure locations.
	    navigator.mediaDevices.getUserMedia(constraints).then(getStream).catch(logError);
	}
}

function getStream(stream) {
	//handle muting of microphone
	stream.getTracks().forEach(function (track) {
		track.onmute = function(){alert("Please un-mute the microphone.")};
	});
	
	//get the audio stream data
	var audioContext = new (window.AudioContext || window.webkitAudioContext)();
	var mediaStreamSourceNode = audioContext.createMediaStreamSource(stream);//must be a mediaStreamSourceNode not a mediaElementSourceNode
	var analyzerNode = audioContext.createAnalyser();
	mediaStreamSourceNode.connect(analyzerNode); //connect the mediaStreamSourceNode to the analyzerNode
	var	frequencyData = new Uint8Array(analyzerNode.frequencyBinCount);//initialize the array with length = freqBinCount
	
	//variables used by d3 animation
	var startTime = new Date();
	var elapsed;
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	screenOrientationRatio = windowWidth/windowHeight;
	
	//create an svg to contain the circles 
	var svgCircleHeight = "100%";
	var svgCircleWidth = "100%";
	var visCircle = document.getElementById("circleVisualisation");
    svg = createCirclesOnSVG("circleSVG", "circle");
	
	
	function createCirclesOnSVG(elementId, className){
	    var c = d3.select(visCircle)
		    .append("svg")
		    .attr("height", svgCircleWidth)
		    .attr("width", svgCircleWidth)
		    .attr("id", elementId);
    
        c.selectAll('circle')
	        .data(frequencyData)
	        .enter()
	        .append("circle")
    	    .attr('cx', '0')
    	    .attr('cy', '0')
    	    .attr('r', '0')
    	    .attr("class",className);
    
	        return c;
	}
	  // Continuously update chart with frequency data.
        function renderChart() {
            // smoother refresh rate, alternative to setInterval
           requestAnimationFrame(renderChart);
            // Copy frequency data to frequencyData array.
            analyzerNode.getByteFrequencyData(frequencyData);
            //display circles with new freq data
            updateCircles(svg,0.15);
            //check if screen has rotated / flipped orientation
            checkForRotation();
        }
    
  
	  function updateCircles(c, radiusSizeRatio){
	        
	        c.selectAll('circle')
	            .data(frequencyData)
	            .transition()
	            .duration(100)
                .attr('cx', function (d, i) {
                        if (screenOrientationRatio < 1){ //landscape
                            return i*(1/screenOrientationRatio);    
                        }else{//portrait
                            return i * screenOrientationRatio;
                        }
                        
                    })
                .attr('cy', function (d, i) {
                    //spread circles out on y axis by 1% of window height, largest y co-ordinate will be 3% less than window Height
                    return (Math.min(windowHeight-(windowHeight*0.03), d * (windowHeight*0.01))) ;
                })
	            .attr('r', function(d,i) {
	                var val = Math.min(i/d,d);
	               if (isNaN(val)){
	                   return radiusSizeRatio;
	               }else if(isFinite(val)){
	                   return val;
	               }else{
	                   return i;
	               }
	            })
	            .attr('fill', function(d,i) {
	                var red;
	                var green;
	                var blue;
	                elapsed = new Date() - startTime;
	                red = (elapsed/100)%255;
	                green = i%255;
	                blue= d%255;
	                return 'rgb(' + red + ',' + green + ', ' + blue + ')';
	            });
	  }
	  // Run the loop
    renderChart();
 }

function checkForRotation(){
    /**event listeners "resize" and "onOrientationChange" were firing recursively
    implemented this custom funciton instead.
    check previous screen width height ratio against new ratio
    if the ratio has "crossed" 1, then the orientation has flipped, reload the page 
    */
    
    var oldRatio;
    var newRatio;
    var oldDirection;
    var newDirection;
    
    //get previus orientation, 1 indicates width is greater than height, -1 indicates opposite
    oldRatio = screenOrientationRatio;
    if (oldRatio > 1){
        oldDirection =1;
    }else{
        oldDirection = -1
    }
    
    //get new orientation
    var newWindowWidth = $(window).width();
	var newWindowHeight = $(window).height();
    newRatio = newWindowWidth/newWindowHeight;
    if (newRatio >1){
        newDirection = 1
    }else{
        newDirection = -1
    }
    
    //if the ratio has flipped, then the page reloads.
    if (newDirection != oldDirection){
        window.location.reload();
    }
}
function logError(error) {
	alert("There was an issue accesing your device's microphone, "
	+ "please enusre the microphone is switched on and working properly."
	+ "\n\nSome Technical Mumbo Jumbo: \n" + error.name + " " + error.message);
}

//stack overflow, https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery/21712356#21712356
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // Edge (IE 12+) => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}