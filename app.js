const mqtt = require('mqtt') // to use the client
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb"; //mongodb://root:bed-sensor-clande@51.79.49.92:30717/?authMechanism=DEFAULT
const fs = require('fs')
const { Command } = require('commander')

const program = new Command()
program
  .option('-p, --protocol <type>', 'connect protocol: mqtt, mqtts, ws, wss. default is mqtt', 'mqtt')
  .parse(process.argv)


const host = '51.79.49.92' //broker
const port = '31883'//broker port
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

// connect options, To use user name and password authentication and a clean session 
const OPTIONS = {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'user',
  password: '1234',
  reconnectPeriod: 1000,
}
// protocol list
const PROTOCOLS = ['mqtt', 'mqtts', 'ws', 'wss']

// default is mqtt, unencrypted tcp connection
let connectUrl = `mqtt://${host}:${port}`
if (program.protocol && PROTOCOLS.indexOf(program.protocol) === -1) {
  console.log('protocol must one of mqtt, mqtts, ws, wss.')
} else if (program.protocol === 'mqtts') {
  // mqtts， encrypted tcp connection
  connectUrl = `mqtts://${host}:8883`
  OPTIONS['ca'] = fs.readFileSync('./broker.emqx.io-ca.crt')
} else if (program.protocol === 'ws') {
  // ws, unencrypted WebSocket connection
  const mountPath = '/mqtt' // mount path, connect emqx via WebSocket
  connectUrl = `ws://${host}:8083${mountPath}`
} else if (program.protocol === 'wss') {
  // wss, encrypted WebSocket connection
  const mountPath = '/mqtt' // mount path, connect emqx via WebSocket
  connectUrl = `wss://${host}:8084${mountPath}`
  OPTIONS['ca'] = fs.readFileSync('./broker.emqx.io-ca.crt')
} else { }

const topic = '/develone/nxysys/bed-sensor/0000020009/health-data' //topic

const client = mqtt.connect(connectUrl, OPTIONS) //when called it connects to an MQTT broker and returns a client class.

//The listener waits for the connect event and calls a callback function; which prints a message when the client connects.
client.on('connect', () => {
  console.log(`${program.protocol}: Connected`)
  client.subscribe([topic], () => {
    console.log(`${program.protocol}: Subscribe to topic '${topic}'`)
  })

  //publish method, showing first message
  for (let index = 0; index < 5; index++) {
    client.publish(topic, '"sensor-event" : { "version" : "' + index + '" , "type" : "1" , "id" : { "uuid" : "012279133214" , "model" : "bed-sensor-02" , "sn" : "2" } , "data" : { "time" : "1653431821" , "sensor" : { "HR" : ' + index*15 + ' , "RR" : ' + index*20 + ' , "SV" : ' + index*18 + ' , "HRV" :  ' + index*19 + ' , "fft_output" : "" , "status" : "" , "B2B" : "" , "B2B1" : "", "B2B2" : ""}}}}', { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }

})

//reconnecting method, Reconnecting(mqtt): undefined
client.on('reconnect', (error) => {
  console.log(`Reconnecting(${program.protocol}):`, error)
})

//error method, cannot connect, this will only catch failures like authentication failures. If you try to connect on the wrong port or the wrong address no error is generated and you will find the client sits there and attempts to reconnect.If the error detects an authentication failure then you will need to quit otherwise the client will continually attempt to connect.
client.on('error', (error) => {
  console.log(`Cannot connect(${program.protocol}):`, error)
})


//mensajes recibidos, the listener waits for the message ecent and calls a callback function, which prints a message when the client receives a message
client.on('message', (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
})

//check if data json or not
function json_check(data) {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  Mongo_insert(JSON.parse(data))
}

//insert data in mongodb
function Mongo_insert(data) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("main");//base de datos
    dbo.collection("healthData").insertOne(data, function (err, res) { //coleccion de base de datos
      if (err) throw err;
      db.close();
    });
  });
}



/*var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, {
  poolSize: 10,
  authSource: "admin",
  user: process.env.MONGODB_USERNAME,
  pass: process.env.MONGODB_PASSWORD,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  //don't show the log when it is test
  if(process.env.NODE_ENV !== "2
  
  +") {
    console.log("Connected to %s", MONGODB_URL);
    console.log("App is running in port %s ... \n", process.env.PORT);
    console.log("Press CTRL + C to stop the process. \n");
  }
}).catch(err => {
  console.error("App starting error:", err.message);
  process.exit(1);
});

var app = express();

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
  return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
  if(err.name == "UnauthorizedError"){
    return apiResponse.unauthorizedResponse(res, err.message);
  }
});

module.exports = app;
*/
