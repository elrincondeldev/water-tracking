#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace gota {

struct StatusFields {
  bool stable;
  bool present;
  bool calibrated;
  int rssi_dbm;
  uint32_t queued;
};

struct NodeEvent {
  uint64_t seq;
  const char* type;
  std::optional<uint64_t> t_ms;
  uint64_t uptime_ms;
  std::optional<float> weight_g;
  std::optional<StatusFields> status;
};

std::string encodeEvent(const NodeEvent& event);
std::string buildBatch(const std::string& device_id, const std::string& firmware,
                       const std::vector<std::string>& events);
std::optional<uint64_t> parseSeq(const std::string& event_json);
std::optional<uint64_t> parseAcceptedSeq(const std::string& ack_json);

}  // namespace gota
