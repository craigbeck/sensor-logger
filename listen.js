var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var util = require("util");

var baudrate = process.argv[2] || 57600;
var parser = serialport.parsers.readline("\n");

var librato = require("librato-metrics").createClient({
  email: process.env.LIBRATO_EMAIL,
  token: process.env.LIBRATO_KEY
});

var port = new SerialPort("/dev/tty.usbmodemfa131", {
  baudrate: 57600,
  parser: parser
});

var log = function () {
  var message = util.format.apply(util.format, arguments);
  console.log("%s - %s", new Date(), message);
};

port.on("open", function () {
  log("open!");
  port.on("data", function (data) {
    try {
      var json = JSON.parse(data);
      log("DATA OK", JSON.stringify(json));
      librato.post("/metrics", {
        gauges: [
          { name: "tempC", value: json.tempC, source: "desk" },
          { name: "pressurePa", value: json.pressurePa, source: "desk" },
          { name: "altitude", value: json.realAtltitudeM, source: "desk" }
        ]
      }, function (err, response) {
        if (err) {
          log("ERR", err);
        }
      });
    } catch (e) {
      log("DATAERR", data.toString());
    }
  });
});

log("starting...");

