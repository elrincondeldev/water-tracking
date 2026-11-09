#include <Arduino.h>
#include <Preferences.h>

#include "config.h"
#include "console.h"
#include "event-detector.h"
#include "event-queue.h"
#include "node-event.h"
#include "reporter.h"
#include "scale.h"
#include "uptime.h"
#include "wall-clock.h"
#include "wifi-link.h"

namespace {

constexpr uint32_t kSerialWaitMs = 2000;
constexpr uint32_t kLiveIntervalMs = 1000;
constexpr uint32_t kHeartbeatMs = 60000;
constexpr uint32_t kFirstHeartbeatMs = 5000;

gota::Scale scale;
gota::EventDetector detector;
gota::EventQueue queue;
gota::WallClock wall_clock;
Preferences node_prefs;
uint64_t next_seq = 1;
bool live = false;
uint32_t last_live_ms = 0;
uint32_t last_heartbeat_ms = 0;
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

void report(const char* type, std::optional<float> weight_g,
            std::optional<gota::StatusFields> status = std::nullopt) {
  const uint64_t uptime_ms = gota::uptimeMs();
  const gota::NodeEvent event{next_seq, type, wall_clock.at(uptime_ms), uptime_ms, weight_g, status};
  next_seq++;
  node_prefs.putULong64("seq", next_seq);
  const std::string json = gota::encodeEvent(event);
  if (!queue.push(json, status.has_value())) Serial.println("# Queue full: heartbeat dropped.");
  Serial.println(json.c_str());
}

void reportStatus() {
  report("status", detector.weight_g(),
         gota::StatusFields{detector.stable(), detector.present(), scale.calibrated(),
                            gota::networkRssiDbm(), static_cast<uint32_t>(queue.size())});
}

}  // namespace

void setup() {
  Serial.begin(115200);
  const uint32_t started_ms = millis();
  while (!Serial && millis() - started_ms < kSerialWaitMs) delay(10);

  Serial.println("# Gota node");
  scale.begin();
  if (!scale.calibrated()) {
    Serial.println("# Not calibrated: empty the plate and send tare, then cal <grams>.");
  }
  node_prefs.begin("node", false);
  next_seq = node_prefs.getULong64("seq", 1);
  if (!queue.begin()) Serial.println("# ERROR: could not mount LittleFS; events are not kept.");

  const gota::Config config = gota::loadConfig();
  gota::beginNetwork(config);
  gota::startReporter(config, queue, wall_clock, next_seq);
  Serial.printf("# Device id %s, next seq %llu, %u events queued\n", gota::deviceId().c_str(),
                static_cast<unsigned long long>(next_seq), static_cast<unsigned>(queue.size()));
  Serial.println("# Send help for commands.");
  last_heartbeat_ms = millis() - kHeartbeatMs + kFirstHeartbeatMs;
}

void loop() {
  gota::pollConsole(console);

  const uint32_t now_ms = millis();
  gota::maintainNetwork(now_ms);
  if (now_ms - last_heartbeat_ms >= kHeartbeatMs) {
    last_heartbeat_ms = now_ms;
    reportStatus();
  }

  long raw;
  if (!scale.read(raw)) return;
  const auto event = detector.update(now_ms, scale.grams(raw));
  if (event && scale.calibrated()) {
    const bool has_weight = event->type != gota::EventType::Removed;
    report(eventName(event->type), has_weight ? std::optional<float>(event->weight_g) : std::nullopt);
  }
  if (scale.calibrated() && detector.emptyAndStable()) scale.trackZero(raw);

  if (live && now_ms - last_live_ms >= kLiveIntervalMs) {
    last_live_ms = now_ms;
    Serial.printf("# weight=%.1f g %s\n", detector.weight_g(),
                  detector.stable() ? "stable" : "moving");
  }
}
