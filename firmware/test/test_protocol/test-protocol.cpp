#include <unity.h>

#include <string>

#include "backoff.h"
#include "http-date.h"
#include "node-event.h"
#include "wall-clock.h"

using namespace gota;

namespace {

void assertStrings(const std::string& expected, const std::string& actual) {
  TEST_ASSERT_EQUAL_STRING(expected.c_str(), actual.c_str());
}

void test_encodes_a_placed_event_rounded_to_a_tenth() {
  const NodeEvent event{41, "placed", 1794225600000ULL, 3605120, 1287.43f, std::nullopt};
  assertStrings(
      R"({"seq":41,"type":"placed","t_ms":1794225600000,"uptime_ms":3605120,"weight_g":1287.4})",
      encodeEvent(event));
}

void test_encodes_an_unsynced_removed_event() {
  const NodeEvent event{40, "removed", std::nullopt, 3593050, std::nullopt, std::nullopt};
  assertStrings(R"({"seq":40,"type":"removed","t_ms":null,"uptime_ms":3593050})",
                encodeEvent(event));
}

void test_encodes_a_status_event() {
  const NodeEvent event{43,          "status", 1794225960000ULL, 3965000, -0.31f,
                        StatusFields{true, false, true, -58, 2}};
  assertStrings(
      R"({"seq":43,"type":"status","t_ms":1794225960000,"uptime_ms":3965000,"weight_g":-0.3,)"
      R"("stable":true,"present":false,"calibrated":true,"rssi_dbm":-58,"queued":2})",
      encodeEvent(event));
}

void test_builds_a_batch_around_encoded_events() {
  assertStrings(
      R"({"v":1,"device_id":"gota-3485180a1b2c","firmware":"0.1.0","events":[{"seq":1},{"seq":2}]})",
      buildBatch("gota-3485180a1b2c", "0.1.0", {R"({"seq":1})", R"({"seq":2})"}));
}

void test_reads_seqs_and_acks() {
  TEST_ASSERT_EQUAL_UINT64(41, *parseSeq(R"({"seq":41,"type":"removed"})"));
  TEST_ASSERT_EQUAL_UINT64(43, *parseAcceptedSeq(R"({"v":1,"accepted_seq":43})"));
  TEST_ASSERT_FALSE(parseAcceptedSeq(R"({"error":{"code":"unauthorized"}})").has_value());
  TEST_ASSERT_FALSE(parseAcceptedSeq("not json").has_value());
}

void test_parses_http_dates() {
  const auto noon = parseHttpDateMs("Mon, 09 Nov 2026 12:00:00 GMT");
  const auto leap = parseHttpDateMs("Thu, 29 Feb 2024 23:59:59 GMT");
  TEST_ASSERT_TRUE(noon.has_value() && leap.has_value());
  TEST_ASSERT_EQUAL_UINT64(1794225600000ULL, noon.value_or(0));
  TEST_ASSERT_EQUAL_UINT64(1709251199000ULL, leap.value_or(0));
  TEST_ASSERT_FALSE(parseHttpDateMs("Mon, 09 Foo 2026 12:00:00 GMT").has_value());
  TEST_ASSERT_FALSE(parseHttpDateMs("Mon, 09 Nov 2026 12:00:00 CET").has_value());
  TEST_ASSERT_FALSE(parseHttpDateMs("").has_value());
}

void test_backoff_doubles_up_to_a_minute() {
  Backoff backoff;
  const uint32_t expected[] = {1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000};
  for (uint32_t delay_ms : expected) TEST_ASSERT_EQUAL_UINT32(delay_ms, backoff.nextDelayMs());
  backoff.reset();
  TEST_ASSERT_EQUAL_UINT32(1000, backoff.nextDelayMs());
}

void test_wall_clock_needs_a_sync() {
  WallClock clock;
  TEST_ASSERT_FALSE(clock.at(5000).has_value());
  clock.sync(1794225600000ULL, 60000);
  TEST_ASSERT_EQUAL_UINT64(1794225540000ULL, *clock.at(0));
  TEST_ASSERT_EQUAL_UINT64(1794225605000ULL, *clock.at(65000));
}

void test_fills_in_time_for_events_of_this_boot() {
  WallClock clock;
  const std::string unsynced = R"({"seq":50,"type":"placed","t_ms":null,"uptime_ms":4396,"weight_g":1325.5})";
  assertStrings(unsynced, withKnownTime(unsynced, 40, clock));
  clock.sync(1794262175806ULL, 4396);
  assertStrings(
      R"({"seq":50,"type":"placed","t_ms":1794262175806,"uptime_ms":4396,"weight_g":1325.5})",
      withKnownTime(unsynced, 40, clock));
}

void test_leaves_earlier_boots_and_known_times_alone() {
  WallClock clock;
  clock.sync(1794262175806ULL, 4396);
  const std::string earlier = R"({"seq":39,"type":"removed","t_ms":null,"uptime_ms":900000})";
  const std::string known = R"({"seq":51,"type":"removed","t_ms":1794262170000,"uptime_ms":1})";
  assertStrings(earlier, withKnownTime(earlier, 40, clock));
  assertStrings(known, withKnownTime(known, 40, clock));
}

}  // namespace

void setUp() {}
void tearDown() {}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_encodes_a_placed_event_rounded_to_a_tenth);
  RUN_TEST(test_encodes_an_unsynced_removed_event);
  RUN_TEST(test_encodes_a_status_event);
  RUN_TEST(test_builds_a_batch_around_encoded_events);
  RUN_TEST(test_reads_seqs_and_acks);
  RUN_TEST(test_parses_http_dates);
  RUN_TEST(test_backoff_doubles_up_to_a_minute);
  RUN_TEST(test_wall_clock_needs_a_sync);
  RUN_TEST(test_fills_in_time_for_events_of_this_boot);
  RUN_TEST(test_leaves_earlier_boots_and_known_times_alone);
  return UNITY_END();
}
