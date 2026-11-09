#pragma once

#include <atomic>
#include <cstdint>
#include <optional>

namespace gota {

class WallClock {
 public:
  void sync(uint64_t unix_ms, uint64_t uptime_ms) {
    offset_ms_.store(static_cast<int64_t>(unix_ms) - static_cast<int64_t>(uptime_ms));
    synced_.store(true);
  }

  std::optional<uint64_t> at(uint64_t uptime_ms) const {
    if (!synced_.load()) return std::nullopt;
    return static_cast<uint64_t>(offset_ms_.load() + static_cast<int64_t>(uptime_ms));
  }

 private:
  std::atomic<int64_t> offset_ms_{0};
  std::atomic<bool> synced_{false};
};

}  // namespace gota
