#pragma once

#include <cstdint>
#include <optional>

#include "stability-window.h"

namespace gota {

enum class EventType { Placed, Removed, Changed };

struct DetectedEvent {
  EventType type;
  float weight_g;
};

class EventDetector {
 public:
  std::optional<DetectedEvent> update(uint32_t now_ms, float reading_g);
  void reset();

  bool present() const { return present_; }
  bool stable() const { return stable_; }
  float weight_g() const { return window_.mean(); }
  bool emptyAndStable() const;

 private:
  bool settled(uint32_t now_ms, uint32_t hold_ms) const;

  StabilityWindow window_;
  bool stable_ = false;
  uint32_t stable_since_ms_ = 0;
  bool present_ = false;
  float reported_g_ = 0.0f;
};

}  // namespace gota
