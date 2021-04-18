// import http from 'http';
// import fs from 'fs';
//
// //create a server object:
// // http.createServer(function (req, res) {
// //     res.writeHead(200, {'Content-Type': 'text/html'});
// //     res.write('<h1>Hello World</h1>'); //write a response to the client
// //     res.end(); //end the response
// // }).listen(8080); //the server object listens on port 8080
// //
// const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
//
// var myAgent = new http.Agent({
//     keepAlive: true,
//     maxSockets: 1,
//     keepAliveMsecs: 3000
// })
//
// fs.readFile('image.jpg', function(err, data) {
//     if (err) throw err // Fail if the file can't be read.
//     http.createServer(async function(req, res) {
//         // res.setTimeout(3000)
//         while(true){
//             res.writeHead(200, {'Content-type': 'multipart/x-mixed-replace; boundary=--jpgboundary'})
//             console.log("Sending...")
//             res.write("--jpgboundary\r\n");
//             res.write("Content-Type: image/jpeg\r\n");
//             res.write("Content-Length: " + data.length + "\r\n");
//             res.write("\r\n");
//             res.write(data, 'binary');
//             res.write("\r\n");
//             // res.write("--jpgboundary\r\n")
//             // res.write(data)
//             res.end() // Send the file data to the browser.
//             // res.setTimeout(3000)
//             await delay(1000)
//             console.log("Delay over")
//         }
//     }).listen(8080)
//     console.log('Server running at http://localhost:8124/')
// })

import util from 'util';
import stream from 'stream';
import http from 'http';
import fs from 'fs';

var Writable = stream.Writable;

function MjpegServer(req, res, options) {
    if (!(this instanceof MjpegServer))
        return new MjpegServer(req, res, options);

    Writable.call(this, options);

    this.res = res;

    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Pragma': 'no-cache'
    });
}
util.inherits(MjpegServer, Writable);

MjpegServer.prototype._write = function(jpeg, encoding, done) {
    this.res.write("--myboundary\r\n");
    this.res.write("Content-Type: image/jpeg\r\n");
    this.res.write("Content-Length: " + jpeg.length + "\r\n");
    this.res.write("\r\n");
    this.res.write(jpeg, 'binary');
    this.res.write("\r\n");
    done();
};

MjpegServer.prototype.close = function() {
    this.res.end();
};



http.createServer(function(req, res) {
    console.log("Got request");

    let mjpegReqHandler = new MjpegServer(req, res);

    var i = 0;
    var timer = setInterval(updateJPG, 50);

    function updateJPG() {
        fs.readFile('./resources/'+ i + '.jpg', sendJPGData);
        i++;
    }

    function sendJPGData(err, data) {
        mjpegReqHandler.write(data, function() {
            checkIfFinished();
        });
    }

    function checkIfFinished() {
        if (i > 100) {
            clearInterval(timer);
            mjpegReqHandler.close();
            console.log('End Request');
        }
    }
}).listen(8080);