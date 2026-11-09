#include "scale.h"

#include <cmath>

#include "pins.h"

namespace gota {

namespace {
constexpr uint8_t kGain = 128;
constexpr uint8_t kAverageSamples = 20;
constexpr uint32_t kReadTimeoutMs = 500;
constexpr double kMinCalibrationCounts = 100.0;
constexpr double kZeroTrackRate = 0.02;
}  // namespace

void Scale::begin() {
  adc_.begin(kPinHx711Dout, kPinHx711Sck, kGain);
  prefs_.begin("scale", false);
  zero_ = prefs_.getLong("zero", 0);
  factor_ = prefs_.getFloat("factor", 1.0f);
  tared_ = prefs_.getBool("tared", false);
  calibrated_ = tared_ && prefs_.getBool("calibrated", false) && std::isfinite(factor_) &&
                factor_ != 0.0f;
  if (!calibrated_) factor_ = 1.0f;
}

bool Scale::read(long& raw) {
  if (!adc_.is_ready()) return false;
  raw = adc_.read();
  return true;
}

float Scale::grams(long raw) const {
  return static_cast<float>((static_cast<double>(raw) - zero_) / factor_);
}

bool Scale::tare() {
  double mean;
  if (!averageRaw(mean)) return false;
  zero_ = std::lround(mean);
  tared_ = true;
  prefs_.putLong("zero", zero_);
  prefs_.putBool("tared", true);
  return true;
}

CalibrationResult Scale::calibrate(float mass_g) {
  if (!tared_) return CalibrationResult::NotTared;
  double mean;
  if (!averageRaw(mean)) return CalibrationResult::NoData;
  const double counts = mean - zero_;
  if (std::fabs(counts) < kMinCalibrationCounts) return CalibrationResult::TooLight;
  factor_ = static_cast<float>(counts / mass_g);
  calibrated_ = true;
  prefs_.putFloat("factor", factor_);
  prefs_.putBool("calibrated", true);
  return CalibrationResult::Ok;
}

// Slowly follows the empty-plate reading to cancel temperature drift; not persisted.
void Scale::trackZero(long raw) {
  zero_ += std::lround((raw - zero_) * kZeroTrackRate);
}

bool Scale::averageRaw(double& mean) {
  double sum = 0;
  for (uint8_t i = 0; i < kAverageSamples; ++i) {
    if (!adc_.wait_ready_timeout(kReadTimeoutMs)) return false;
    sum += adc_.read();
  }
  mean = sum / kAverageSamples;
  return true;
}

}  // namespace gota
