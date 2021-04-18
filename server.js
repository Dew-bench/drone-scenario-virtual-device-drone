import vDroneHandler from "./vDroneHandler.js"
import http from 'http';


const drone = new vDroneHandler(600, 600);
const FPS = 2;
let ID = -1;
const DEBUG = false;

const VALID_PATHS = {
    "GET": ["/","/api/sensors", "/stream/mjpeg", "/stream/jpg"],
    "PUT": ["/api/drone/orientation/x", "/api/drone/orientation/y", "/api/drone/orientation/z",
        "/api/drone/position/x", "/api/drone/position/y", "/api/drone/position/z",
        "/api/drone/speed", "/api/processing", "/api/id", "/api/kafka/url", "/api/kafka/produce", "/api/master/url",
    ]
}

function updateJPG(response) {
    return async function () {
        drone.getNewFrame();
        let data = await drone.getJPGFrame().jpeg({quality: 100, chromaSubsampling: '4:4:4'}).toBuffer()
        response.write("--thelinemustbedrawnhere\r\n");
        response.write("Content-Type: image/jpeg\r\n");
        response.write("Content-Length: " + data.length + "\r\n");
        response.write("\r\n");
        response.write(data, 'binary');
        response.write("\r\n");
    }
}


http.createServer(function(req, res) {
    if(DEBUG) console.log("got request");
    if(DEBUG) res.on("close", ()=>{console.log("end request")})
    if(DEBUG) req.on("error", (e)=>{console.log(e)})


    const reqPathString = new URL(req.url, `http://${req.headers.host}`).pathname
    let reqPath_ = reqPathString.split('/')
    reqPath_.shift()
    const reqPath = reqPath_
    const reqMethod = req.method

    // path error handling OK?
    if(!(reqMethod in VALID_PATHS ) || !VALID_PATHS[reqMethod].includes(reqPathString)){
        res.writeHead(404)
        res.end()
        return;
    }

    if(reqMethod === "GET"){
        if(reqPath[0] === ''){ // OK
            res.write(`<h1>Drone id : ${ID.toString()} </h1>`)
            res.end()
        }

        else if(reqPath[0] === 'stream'){
            if(reqPath[1] === 'mjpeg'){ // OK, TODO add trailer to put timestamp ?
                res.writeHead(200, {
                    'Content-Type': 'multipart/x-mixed-replace; boundary=thelinemustbedrawnhere',
                    'Cache-Control': 'no-cache',
                    'Connection': 'close',
                    'Pragma': 'no-cache'
                });
                let frames_timer = setInterval(updateJPG(res), 1000/FPS);
                res.on("Close", ()=>{ clearInterval(frames_timer);})
            }
            else if(reqPath[1] === 'jpg'){ //TODO
                res.write(`<h1>Drone id : ${ID.toString()} </h1>`)
                res.end()
            }
        }

        else if(reqPath[0] === "api" && reqPath[1] === "sensors"){ // OK
            res.write(JSON.stringify(drone.getSensors()))
            res.end()
        }
    }

    else if(reqMethod === "PUT"){
        let data = {data:""};
        req.on('data', chunk => {data.data += chunk;})

        if(reqPath[0] === "api"){
            let end_response_and_call = erarc(res, reqPath, data)
            if(reqPath[1] === "drone" && reqPath.length === 4) req.on("end",end_response_and_call(handle_drone_move)) // OK
            else if(reqPath[1] === "drone" && reqPath[2] === "speed") req.on("end",end_response_and_call(handle_drone_speed)) // OK
            else if(reqPath[1] === "processing") req.on("end",()=>{console.log(data, reqPath)})
            else if(reqPath[1] === "id") req.on("end",end_response_and_call(handle_id)) // OK
            else if(reqPath[1] === "kafka" && reqPath[2] === "url") req.on("end",()=>{console.log(data, reqPath)})
            else if(reqPath[1] === "kafka" && reqPath[2] === "produce") req.on("end",()=>{console.log(data, reqPath)})
            else if(reqPath[1] === "master" && reqPath[2] === "url") req.on("end",()=>{console.log(data, reqPath)})
        }
    }

}).listen(5000);

function erarc(response, url, data){ // End Response And Return Call
    return function (fun) { // bind function to call
        return function () { // event handler
            // console.log(data.data, JSON.parse(data.data), typeof data.data, url, fun)
            // console.log(data)
            data = JSON.parse(data.data)["val"] // pass be reference ( primitives like string is pass by value)
            // console.log(data)
            fun(url, data)
            response.end()
        }
    }
}

function handle_drone_move(url, value){
    drone.move(url[url.length-2], url[url.length-1], value)
}

function handle_drone_speed(url, value){
    drone.setSpeed(value);
}

function handle_id(url, value){
    ID = value;
}