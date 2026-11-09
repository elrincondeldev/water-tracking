#include <Arduino.h>

#include "config.h"
#include "console.h"
#include "event-detector.h"
#include "wifi-link.h"
#include "scale.h"

namespace {

constexpr uint32_t kSerialWaitMs = 2000;
constexpr uint32_t kLiveIntervalMs = 1000;

gota::Scale scale;
gota::EventDetector detector;
bool live = false;
uint32_t last_live_ms = 0;
gota::ConsoleContext console{scale, detector, live};

const char* eventName(gota::EventType type) {
  switch (type) {
    case gota::EventType::Placed:
      return "placed";
    case gota::EventType::Removed:
      return "removed";
    case gota::EventType::Changed:
      return "changed";
  }
  return "unknown";
}

void printEvent(const gota::DetectedEvent& event, uint32_t uptime_ms) {
  Serial.printf("{\"type\":\"%s\"", eventName(event.type));
  if (event.type != gota::EventType::Removed) Serial.printf(",\"weight_g\":%.1f", event.weight_g);
  Serial.printf(",\"uptime_ms\":%lu}\n", static_cast<unsigned long>(uptime_ms));
}

}  // namespace

void setup() {
  Serial.begin(115200);
  const uint32_t started_ms = millis();
  while (!Serial && millis() - started_ms < kSerialWaitMs) delay(10);

  scale.begin();
  Serial.println("# Gota node");
  gota::beginNetwork(gota::loadConfig());
  Serial.printf("# Device id %s\n", gota::deviceId().c_str());
  if (!scale.calibrated()) {
    Serial.println("# Not calibrated: empty the plate and send tare, then cal <grams>.");
  }
  Serial.println("# Send help for commands.");
}

void loop() {
  gota::pollConsole(console);

  long raw;
  if (!scale.read(raw)) return;
  const uint32_t now_ms = millis();
  const auto event = detector.update(now_ms, scale.grams(raw));
  if (event && scale.calibrated()) printEvent(*event, now_ms);
  if (scale.calibrated() && detector.emptyAndStable()) scale.trackZero(raw);

  if (live && now_ms - last_live_ms >= kLiveIntervalMs) {
    last_live_ms = now_ms;
    Serial.printf("# weight=%.1f g %s\n", detector.weight_g(),
                  detector.stable() ? "stable" : "moving");
  }
}
