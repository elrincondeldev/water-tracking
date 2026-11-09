#pragma once

#include <cstdint>

namespace gota {

constexpr uint8_t kWindowSize = 12;  // ~1.2 s at the HX711's 10 Hz
constexpr float kStableRangeG = 3.0f;
constexpr uint32_t kStableHoldMs = 1500;
constexpr float kPresenceG = 100.0f;
constexpr float kChangeMinG = 5.0f;
constexpr uint32_t kChangeHoldMs = 5000;
constexpr float kZeroTrackBandG = 4.0f;

}  // namespace gota
