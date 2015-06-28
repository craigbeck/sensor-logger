var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var util = require("util");
var _ = require("lodash");

var baudrate = process.argv[2] || 57600;
var parser = serialport.parsers.readline("\n");

var librato = require("librato-metrics").createClient({
  email: process.env.LIBRATO_EMAIL,
  token: process.env.LIBRATO_KEY
});

var log = function () {
  var message = util.format.apply(util.format, arguments);
  console.log("%s - %s", new Date(), message);
};

serialport.list(function (err, comPorts) {
  if (err) {
    return console.error("Could not list com ports", err);
  }

  var portdef = _(comPorts)
    .find(function (comPort) {
      return comPort.vendorId === "0x2341";
    });

  if (!portdef) {
    return console.error("No Ardnuino found");
  }
  log("Found Arduino on", portdef.comName);

  var port = new SerialPort(portdef.comName, {
    baudrate: 57600,
    parser: parser
  });

  port.on("error", function (err) {
    console.log("ERR port", err.stack);
  });

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
            log("ERR librato", err);
          }
        });
      } catch (e) {
        log("DATAERR", data.toString());
      }
    });
  });

  log("starting...");
});

