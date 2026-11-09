#include "stability-window.h"

#include <algorithm>

namespace gota {

void StabilityWindow::push(float weight_g) {
  samples_[next_] = weight_g;
  next_ = (next_ + 1) % kWindowSize;
  if (count_ < kWindowSize) count_++;
}

void StabilityWindow::clear() {
  next_ = 0;
  count_ = 0;
}

float StabilityWindow::mean() const {
  if (count_ == 0) return 0.0f;
  double sum = 0;
  for (uint8_t i = 0; i < count_; ++i) sum += samples_[i];
  return static_cast<float>(sum / count_);
}

float StabilityWindow::range() const {
  if (count_ == 0) return 0.0f;
  const auto [min, max] = std::minmax_element(samples_.begin(), samples_.begin() + count_);
  return *max - *min;
}

}  // namespace gota
