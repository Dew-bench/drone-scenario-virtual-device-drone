import http from 'http';
import fs from 'fs';



http.createServer(function(req, res) {
    console.log("Got request");


    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=thelinemustbedrawnhere',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Pragma': 'no-cache'
    });

    var i = 0;
    var timer = setInterval(updateJPG, 50);

    function updateJPG() {
        fs.readFile('./testing/resources/'+ i + '.jpg', sendJPGData);
        i++;
    }

    function sendJPGData(err, data) {
        console.log(data)
        res.write("--thelinemustbedrawnhere\r\n");
        res.write("Content-Type: image/jpeg\r\n");
        res.write("Content-Length: " + data.length + "\r\n");
        res.write("\r\n");
        res.write(data, 'binary');
        res.write("\r\n");

        checkIfFinished();
    }

    function checkIfFinished() {
        if (i > 100) {
            clearInterval(timer);
            res.end();
            console.log('End Request');
        }
    }
}).listen(8080);