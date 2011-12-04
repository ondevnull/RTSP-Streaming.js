/**
 * RTSP Streaming's server.js
 * --------------------------
 *  This script runs a server that fetchs stale images from a ffmpeg
 *  output and sends it with Socket.IO to a client in a volatile-manner.
 *
 *  Requires: Node.js, Socket.IO and FFmpeg, but compiled with libmjpeg 
 *  support and the last version from git-master tree.
 *
 * Created on: December 02, 2011.
 * Copyright © 2011, Jose Luis Rivas. All Rights Reserved.
 **/

/**
 * Variables for Socket.IO and HTTP server
 **/
var	http = require('http').createServer(handler),
		basedir = __dirname + '/../',
		io = require('socket.io').listen(http),
		fs = require('fs');

// It will listen on port 8081 avoiding other HTTP server on the same IP
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
  fs.readFile(basedir + '/client/index.html',
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
//		input = 'rtsp://192.168.1.217:554/0', // Input file or stream
		input = '/home/ghostbar/shell-20110908-1.webm', // Local input file
		rate = 5, // Video FPS rate.
		quality = 'qvga', // Quality of the image
		imgdir = 'img/', // Where JPGs are going to be stored
		suffixout = 'camaraip', // Suffix for the JPEG output of FFmpeg
		prefixout = '001',
		outextension = 'jpg';

/**
 * Call to FFmpeg
 **/
child = exec('ffmpeg -i ' + input + ' -r ' + rate + ' -s qvga -f image2 -updatefirst 1 ' + basedir + imgdir + prefixout + '_' + suffixout + '.' + outextension,
	function (error, stdout, stderr) {
    if (error !== null) {
      console.error('FFmpeg\'s exec error: ' + error);
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
/*
var processImage = function(image,success) {
	io.broadcast ({
		data: image.data.toString('base64'),
		width: image.width,
		height: image.height;
	});
	success(true);
}); */


io.sockets.on('connection', function (client) {
	
	/**
	 * @name imageWatcher
	 * @desc Watchdog for any change on image files
	 * @params complete file path
	 **/
	var imgcount = 0;
	console.log( basedir + imgdir);
	fs.watch( basedir + imgdir,
			function (watchevent, filename) {
				/**
				 * fs.watch returns a FSWatcher object, which has 2 callback 
				 * functions, `change` with event and filename as params; and
				 * `error` with exception as param, so if there's no filename
				 * param we send it to an error-catcher.
				 **/
				if (filename) {
					fs.readFile( basedir + imgdir + filename,
						function(err, content) {
							if (err) {
								throw err;
							} else {
								++imgcount;
								console.log( 'Transformation #' + imgcount);
								client.volatile.emit('message', {
									data: content.toString('base64')
								});
							}
						});
				} else { // Here it comes the error-catcher
					console.warn(stderr);
					if (error !== null) {
						// Print-out on log the exception
						console.error('Watching files error: ' + watchevent);
					}
				}
	});

});
