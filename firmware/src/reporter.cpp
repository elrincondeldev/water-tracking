#include "reporter.h"

#include <HTTPClient.h>

#include "backoff.h"
#include "http-date.h"
#include "node-event.h"
#include "uptime.h"
#include "version.h"
#include "wifi-link.h"

namespace gota {

namespace {

constexpr size_t kBatchMax = 50;
constexpr uint16_t kHttpTimeoutMs = 5000;
constexpr uint32_t kIdlePollMs = 250;
constexpr uint32_t kTaskStackBytes = 8192;

struct Reporter {
  Config config;
  EventQueue& queue;
  WallClock& clock;
  Backoff backoff;
  bool failing = false;
};

enum class SendResult { Ok, Failed };

SendResult send(Reporter& reporter, const std::vector<std::string>& events) {
  HTTPClient http;
  const String url = reporter.config.api_url + "/api/v1/node/events";
  if (!http.begin(url)) return SendResult::Failed;
  http.setTimeout(kHttpTimeoutMs);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + reporter.config.api_token);
  const char* headers[] = {"Date"};
  http.collectHeaders(headers, 1);

  const std::string body = buildBatch(deviceId().c_str(), kFirmwareVersion, events);
  const int status = http.POST(String(body.c_str()));
  const auto accepted_seq = status == 200 ? parseAcceptedSeq(http.getString().c_str())
                                          : std::nullopt;
  const String date = http.header("Date");
  http.end();

  if (!accepted_seq) {
    if (!reporter.failing) Serial.printf("# API unreachable or refused (HTTP %d); retrying\n", status);
    reporter.failing = true;
    return SendResult::Failed;
  }
  if (const auto unix_ms = parseHttpDateMs(date.c_str())) reporter.clock.sync(*unix_ms, uptimeMs());
  reporter.queue.ackUpTo(*accepted_seq);
  if (reporter.failing) Serial.println("# API reachable again");
  reporter.failing = false;
  return SendResult::Ok;
}

void run(void* parameter) {
  Reporter& reporter = *static_cast<Reporter*>(parameter);
  for (;;) {
    if (!networkConnected() || reporter.queue.size() == 0) {
      vTaskDelay(pdMS_TO_TICKS(kIdlePollMs));
      continue;
    }
    if (send(reporter, reporter.queue.peek(kBatchMax)) == SendResult::Ok) {
      reporter.backoff.reset();
    } else {
      vTaskDelay(pdMS_TO_TICKS(reporter.backoff.nextDelayMs()));
    }
  }
}

}  // namespace

void startReporter(const Config& config, EventQueue& queue, WallClock& clock) {
  if (config.api_url.isEmpty() || config.api_token.isEmpty()) {
    Serial.println("# API not configured: set api.url and api.token, then reboot.");
    return;
  }
  static Reporter reporter{config, queue, clock};
  xTaskCreatePinnedToCore(run, "reporter", kTaskStackBytes, &reporter, 1, nullptr, 0);
}

}  // namespace gota
