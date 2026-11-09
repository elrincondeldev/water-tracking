#include "console.h"

#include "thresholds.h"

namespace gota {

namespace {

constexpr size_t kMaxLineLength = 120;
String line;

void printHelp() {
  Serial.println("# Commands:");
  Serial.println("#   status       weight, stability, presence and calibration");
  Serial.println("#   tare         set zero; the plate must be empty");
  Serial.println("#   cal <grams>  calibrate with a known mass on the plate, e.g. cal 1531");
  Serial.println("#   live         toggle one weight reading per second");
  Serial.println("#   help         this list");
}

void printStatus(ConsoleContext& ctx) {
  Serial.printf(
      "{\"type\":\"status\",\"weight_g\":%.1f,\"stable\":%s,\"present\":%s,\"tared\":%s,"
      "\"calibrated\":%s,\"factor\":%.4f,\"uptime_ms\":%lu}\n",
      ctx.detector.weight_g(), ctx.detector.stable() ? "true" : "false",
      ctx.detector.present() ? "true" : "false", ctx.scale.tared() ? "true" : "false",
      ctx.scale.calibrated() ? "true" : "false", ctx.scale.factor(),
      static_cast<unsigned long>(millis()));
}

void tare(ConsoleContext& ctx) {
  if (ctx.scale.calibrated() && ctx.detector.weight_g() > kPresenceG) {
    Serial.println("# ERROR: remove the bottle before taring.");
    return;
  }
  if (!ctx.scale.tare()) {
    Serial.println("# ERROR: no data from the HX711.");
    return;
  }
  ctx.detector.reset();
  Serial.println("# TARE_OK");
}

void calibrate(ConsoleContext& ctx, const String& argument) {
  const float mass_g = argument.toFloat();
  if (!(mass_g > 0.0f)) {
    Serial.println("# Usage: cal <grams>, e.g. cal 1531");
    return;
  }
  switch (ctx.scale.calibrate(mass_g)) {
    case CalibrationResult::Ok:
      ctx.detector.reset();
      Serial.printf("# CALIBRATION_OK factor=%.6f\n", ctx.scale.factor());
      return;
    case CalibrationResult::NotTared:
      Serial.println("# ERROR: tare with the plate empty first.");
      return;
    case CalibrationResult::NoData:
      Serial.println("# ERROR: no data from the HX711.");
      return;
    case CalibrationResult::TooLight:
      Serial.println("# ERROR: change too small; put the mass on the plate.");
      return;
  }
}

void handle(ConsoleContext& ctx, String command) {
  command.trim();
  if (command.isEmpty()) return;
  if (command == "help" || command == "?") return printHelp();
  if (command == "status") return printStatus(ctx);
  if (command == "tare") return tare(ctx);
  if (command.startsWith("cal ")) return calibrate(ctx, command.substring(4));
  if (command == "live") {
    ctx.live = !ctx.live;
    Serial.println(ctx.live ? "# live ON" : "# live OFF");
    return;
  }
  Serial.println("# Unknown command.");
  printHelp();
}

}  // namespace

void pollConsole(ConsoleContext& ctx) {
  while (Serial.available()) {
    const char ch = static_cast<char>(Serial.read());
    if (ch == '\n' || ch == '\r') {
      handle(ctx, line);
      line = "";
    } else if (line.length() < kMaxLineLength) {
      line += ch;
    }
  }
}

}  // namespace gota
