#include "node-event.h"

#include <ArduinoJson.h>

#include <cmath>

namespace gota {

namespace {

constexpr int kProtocolVersion = 1;

double roundTenth(float weight_g) { return std::round(static_cast<double>(weight_g) * 10.0) / 10.0; }

std::optional<uint64_t> readUnsigned(const std::string& json, const char* field) {
  JsonDocument doc;
  if (deserializeJson(doc, json) != DeserializationError::Ok) return std::nullopt;
  const JsonVariant value = doc[field];
  if (!value.is<uint64_t>()) return std::nullopt;
  return value.as<uint64_t>();
}

}  // namespace

std::string encodeEvent(const NodeEvent& event) {
  JsonDocument doc;
  doc["seq"] = event.seq;
  doc["type"] = event.type;
  if (event.t_ms) {
    doc["t_ms"] = *event.t_ms;
  } else {
    doc["t_ms"] = nullptr;
  }
  doc["uptime_ms"] = event.uptime_ms;
  if (event.weight_g) doc["weight_g"] = roundTenth(*event.weight_g);
  if (event.status) {
    doc["stable"] = event.status->stable;
    doc["present"] = event.status->present;
    doc["calibrated"] = event.status->calibrated;
    doc["rssi_dbm"] = event.status->rssi_dbm;
    doc["queued"] = event.status->queued;
  }
  std::string out;
  serializeJson(doc, out);
  return out;
}

std::string buildBatch(const std::string& device_id, const std::string& firmware,
                       const std::vector<std::string>& events) {
  JsonDocument head;
  head["v"] = kProtocolVersion;
  head["device_id"] = device_id;
  head["firmware"] = firmware;
  std::string out;
  serializeJson(head, out);
  out.pop_back();
  out += ",\"events\":[";
  for (size_t i = 0; i < events.size(); ++i) {
    if (i > 0) out += ',';
    out += events[i];
  }
  out += "]}";
  return out;
}

std::optional<uint64_t> parseSeq(const std::string& event_json) {
  return readUnsigned(event_json, "seq");
}

std::optional<uint64_t> parseAcceptedSeq(const std::string& ack_json) {
  return readUnsigned(ack_json, "accepted_seq");
}

}  // namespace gota
