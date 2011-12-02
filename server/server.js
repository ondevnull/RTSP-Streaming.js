/**
 * Variables for Socket.IO and HTTP server
 **/
var	http = require('http').createServer(handler),
		io = require('socket.io').listen(http),
		fs = require('fs');

// It will listen on port 8080 avoiding other HTTP server on the same IP
http.listen(8081);

/**
 * @name handler
 * @desc Handler of HTTP requests (HTTP server)
 * @params
 * req: the request made by the browser.
 * res: the response sent by the function to the browser.
 **/
function handler (req, res) {
	// It will read the HTML file for clients
  fs.readFile(__dirname + '/client/index.html',
  function (err, data) {
    if (err) { // If something bad happens, then do:
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
		// Send data to the client
    res.writeHead(200,{'Content-Type':'text/html'});
    res.write(data,'utf8');
		res.end();
  });
}

/**
 * Variables for FFmpeg
 **/
var util = require('util'),
		exec = require('child_process').exec,
		child,
		input = 'rtsp://localhost:8999/0', // Input file or stream
		rate = 30, // Video FPS rate.
		quality = 'qvga', // Quality of the image
		suffixout = 'camaraip', // Suffix for the JPEG output of FFmpeg
		prefixout = '001',
		outextension = 'jpg';

/**
 * Call to FFmpeg
 **/
child = exec('ffmpeg -i ' + input + ' -r ' + rate + ' -s qvga -f image2 -updatefirst 1 ' + __dirname + prefixout + '_' + suffixout + '.' + outextension,
	function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('FFmpeg\'s exec error: ' + error);
    }
});

/**
 * @name processImage
 * @desc Process Images for converting to base64 and passing along
 * with Socket.IO
 * @params
 * image: image to use
 * success: if the function is successful
 **/
var processImage = function(image,success) {
	io.broadcast ({
		data: image.data.toString('base64'),
		width: image.width,
		height: image.height;
	});
	success(true);
});


