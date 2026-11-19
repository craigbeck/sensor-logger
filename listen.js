import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import Librato from "librato-metrics";

const baudRate = parseInt(process.argv[2] || "57600", 10);

const librato = Librato.createClient({
  email: process.env.LIBRATO_EMAIL,
  token: process.env.LIBRATO_KEY,
});

function log(...args) {
  console.log(new Date().toISOString(), "-", ...args);
}

function postMetrics(json) {
  return new Promise((resolve, reject) => {
    librato.post(
      "/metrics",
      {
        gauges: [
          { name: "tempC", value: json.tempC, source: "desk" },
          { name: "pressurePa", value: json.pressurePa, source: "desk" },
          { name: "altitude", value: json.realAtltitudeM, source: "desk" },
        ],
      },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
}

async function main() {
  const ports = await SerialPort.list();
  // Arduino USB vendor ID (without 0x prefix, as returned by modern serialport)
  const portDef = ports.find((p) => p.vendorId === "2341");

  if (!portDef) {
    console.error("No Arduino found");
    process.exit(1);
  }

  log("Found Arduino on", portDef.path);

  const port = new SerialPort({ path: portDef.path, baudRate });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  port.on("error", (err) => {
    console.error("Serial port error:", err.message);
  });

  port.on("open", () => {
    log("Port open");
  });

  parser.on("data", async (data) => {
    try {
      const json = JSON.parse(data);
      log("DATA OK", JSON.stringify(json));
      await postMetrics(json);
    } catch (e) {
      log("DATAERR", data.toString(), e.message);
    }
  });

  log("Starting...");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
