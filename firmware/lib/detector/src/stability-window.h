#pragma once

#include <array>
#include <cstdint>

#include "thresholds.h"

namespace gota {

class StabilityWindow {
 public:
  void push(float weight_g);
  void clear();
  bool full() const { return count_ == kWindowSize; }
  float mean() const;
  float range() const;

 private:
  std::array<float, kWindowSize> samples_{};
  uint8_t next_ = 0;
  uint8_t count_ = 0;
};

}  // namespace gota
