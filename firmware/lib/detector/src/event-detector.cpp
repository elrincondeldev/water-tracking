#include "event-detector.h"

#include <cmath>

namespace gota {

std::optional<DetectedEvent> EventDetector::update(uint32_t now_ms, float reading_g) {
  window_.push(reading_g);

  // Lifting is fast: one reading under the threshold is enough.
  if (present_ && reading_g < kPresenceG) {
    present_ = false;
    return DetectedEvent{EventType::Removed, reading_g};
  }
  if (!window_.full()) return std::nullopt;

  const bool stable_now = window_.range() < kStableRangeG;
  if (stable_now && !stable_) stable_since_ms_ = now_ms;
  stable_ = stable_now;
  if (!settled(now_ms, kStableHoldMs)) return std::nullopt;

  const float weight_g = window_.mean();
  if (weight_g < kPresenceG) return std::nullopt;

  if (!present_) {
    present_ = true;
    reported_g_ = weight_g;
    return DetectedEvent{EventType::Placed, weight_g};
  }
  if (std::fabs(weight_g - reported_g_) >= kChangeMinG && settled(now_ms, kChangeHoldMs)) {
    reported_g_ = weight_g;
    return DetectedEvent{EventType::Changed, weight_g};
  }
  return std::nullopt;
}

void EventDetector::reset() {
  window_.clear();
  stable_ = false;
  present_ = false;
}

bool EventDetector::emptyAndStable() const {
  return !present_ && stable_ && std::fabs(window_.mean()) < kZeroTrackBandG;
}

bool EventDetector::settled(uint32_t now_ms, uint32_t hold_ms) const {
  return stable_ && now_ms - stable_since_ms_ >= hold_ms;
}

}  // namespace gota
