#pragma once

#include <HX711.h>
#include <Preferences.h>

namespace gota {

enum class CalibrationResult { Ok, NoData, NotTared, TooLight };

class Scale {
 public:
  void begin();
  bool read(long& raw);
  float grams(long raw) const;
  bool calibrated() const { return calibrated_; }
  bool tared() const { return tared_; }
  float factor() const { return factor_; }

  bool tare();
  CalibrationResult calibrate(float mass_g);
  void trackZero(long raw);

 private:
  bool averageRaw(double& mean);

  HX711 adc_;
  Preferences prefs_;
  long zero_ = 0;
  float factor_ = 1.0f;
  bool tared_ = false;
  bool calibrated_ = false;
};

}  // namespace gota
