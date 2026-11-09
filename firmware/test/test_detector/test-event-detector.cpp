#include <unity.h>

#include <vector>

#include "event-detector.h"

using gota::DetectedEvent;
using gota::EventDetector;
using gota::EventType;

namespace {

constexpr uint32_t kSampleMs = 100;

struct Run {
  EventDetector detector;
  uint32_t now_ms = 0;
  std::vector<DetectedEvent> events;

  void hold(float weight_g, uint32_t duration_ms, float noise_g = 0.4f) {
    for (uint32_t t = 0; t < duration_ms; t += kSampleMs) {
      const float jitter = (t / kSampleMs) % 2 == 0 ? noise_g : -noise_g;
      sample(weight_g + jitter);
    }
  }

  void slosh(float weight_g, uint32_t duration_ms) {
    for (uint32_t t = 0; t < duration_ms; t += kSampleMs) {
      sample(weight_g + ((t / kSampleMs) % 2 == 0 ? 12.0f : -12.0f));
    }
  }

  void ramp(float from_g, float to_g, uint32_t duration_ms) {
    const uint32_t steps = duration_ms / kSampleMs;
    for (uint32_t i = 0; i < steps; ++i) sample(from_g + (to_g - from_g) * i / steps);
  }

  void sample(float weight_g) {
    if (auto event = detector.update(now_ms, weight_g)) events.push_back(*event);
    now_ms += kSampleMs;
  }
};

void assertEvent(const DetectedEvent& event, EventType type, float weight_g) {
  TEST_ASSERT_EQUAL(static_cast<int>(type), static_cast<int>(event.type));
  if (type != EventType::Removed) TEST_ASSERT_FLOAT_WITHIN(0.5f, weight_g, event.weight_g);
}

void test_empty_plate_emits_nothing() {
  Run run;
  run.hold(0.0f, 60000);
  TEST_ASSERT_EQUAL(0, run.events.size());
  TEST_ASSERT_TRUE(run.detector.emptyAndStable());
}

void test_bottle_on_the_plate_at_boot_is_placed_once_stable() {
  Run run;
  run.hold(1531.0f, 2500);
  TEST_ASSERT_EQUAL(0, run.events.size());
  run.hold(1531.0f, 2000);
  TEST_ASSERT_EQUAL(1, run.events.size());
  assertEvent(run.events[0], EventType::Placed, 1531.0f);
  TEST_ASSERT_FALSE(run.detector.emptyAndStable());
}

void test_sloshing_is_ignored_until_the_weight_settles() {
  Run run;
  run.hold(0.0f, 3000);
  run.slosh(1287.4f, 1500);
  TEST_ASSERT_EQUAL(0, run.events.size());
  run.hold(1287.4f, 4000);
  TEST_ASSERT_EQUAL(1, run.events.size());
  assertEvent(run.events[0], EventType::Placed, 1287.4f);
}

void test_one_reading_under_the_threshold_removes_the_bottle() {
  Run run;
  run.hold(1531.0f, 5000);
  run.sample(60.0f);
  TEST_ASSERT_EQUAL(2, run.events.size());
  assertEvent(run.events[1], EventType::Removed, 0.0f);
}

void test_lift_and_put_back_lighter() {
  Run run;
  run.hold(1531.0f, 5000);
  run.hold(0.0f, 8000);
  run.slosh(1287.4f, 1000);
  run.hold(1287.4f, 4000);
  TEST_ASSERT_EQUAL(3, run.events.size());
  assertEvent(run.events[1], EventType::Removed, 0.0f);
  assertEvent(run.events[2], EventType::Placed, 1287.4f);
}

void test_refill_in_place_is_a_change_after_five_stable_seconds() {
  Run run;
  run.hold(800.0f, 5000);
  run.ramp(800.0f, 1530.6f, 6000);
  run.hold(1530.6f, 3000);
  TEST_ASSERT_EQUAL(1, run.events.size());
  run.hold(1530.6f, 4000);
  TEST_ASSERT_EQUAL(2, run.events.size());
  assertEvent(run.events[1], EventType::Changed, 1530.6f);
}

void test_small_drift_is_not_a_change() {
  Run run;
  run.hold(1531.0f, 5000);
  run.ramp(1531.0f, 1527.0f, 20000);
  run.hold(1527.0f, 20000);
  TEST_ASSERT_EQUAL(1, run.events.size());
}

void test_reset_forgets_the_bottle() {
  Run run;
  run.hold(1531.0f, 5000);
  run.detector.reset();
  run.hold(1531.0f, 5000);
  TEST_ASSERT_EQUAL(2, run.events.size());
  assertEvent(run.events[1], EventType::Placed, 1531.0f);
}

}  // namespace

void setUp() {}
void tearDown() {}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_empty_plate_emits_nothing);
  RUN_TEST(test_bottle_on_the_plate_at_boot_is_placed_once_stable);
  RUN_TEST(test_sloshing_is_ignored_until_the_weight_settles);
  RUN_TEST(test_one_reading_under_the_threshold_removes_the_bottle);
  RUN_TEST(test_lift_and_put_back_lighter);
  RUN_TEST(test_refill_in_place_is_a_change_after_five_stable_seconds);
  RUN_TEST(test_small_drift_is_not_a_change);
  RUN_TEST(test_reset_forgets_the_bottle);
  return UNITY_END();
}
