#pragma once

#include <algorithm>
#include <cstdint>

namespace gota {

class Backoff {
 public:
  uint32_t nextDelayMs() {
    const uint32_t delay_ms = delay_ms_;
    delay_ms_ = std::min(delay_ms_ * 2, kMaxMs);
    return delay_ms;
  }
  void reset() { delay_ms_ = kMinMs; }

 private:
  static constexpr uint32_t kMinMs = 1000;
  static constexpr uint32_t kMaxMs = 60000;
  uint32_t delay_ms_ = kMinMs;
};

}  // namespace gota
