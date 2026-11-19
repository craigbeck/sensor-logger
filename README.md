# sensor-logger

A Node.js app that listens on a serial port for JSON data from an Arduino and posts
the metrics to [Librato](https://www.librato.com).

The original setup used an Adafruit BMP085 breakout board to measure temperature and
barometric pressure, with the Arduino sending readings as JSON over USB serial.

## Expected JSON format

The Arduino should send newline-delimited JSON on the serial port:

```json
{"tempC": 21.5, "pressurePa": 101325, "realAtltitudeM": 45.2}
```

The app detects the Arduino by vendor ID (`0x2341`) from the port listing.

## Prerequisites

- Node.js
- A Librato account (get credentials at [librato.com](https://www.librato.com))

## Setup

```sh
npm install
```

Set the following environment variables:

```sh
export LIBRATO_EMAIL=your@email.com
export LIBRATO_KEY=your-librato-api-key
```

## Running

```sh
node listen.js [baudrate]
```

The optional `baudrate` argument defaults to `57600`.

## Metrics posted to Librato

| Gauge | Source field |
|---|---|
| `tempC` | `json.tempC` |
| `pressurePa` | `json.pressurePa` |
| `altitude` | `json.realAtltitudeM` |

All metrics are posted with `source: "desk"`.
