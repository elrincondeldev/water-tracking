#include "event-queue.h"

#include <LittleFS.h>

#include "node-event.h"

namespace gota {

namespace {

constexpr const char* kQueuePath = "/queue.jsonl";
constexpr const char* kTempPath = "/queue.tmp";
// Weight events are always kept; heartbeats stop being queued past this size.
constexpr size_t kMaxDroppableBacklog = 5000;

class Lock {
 public:
  explicit Lock(SemaphoreHandle_t mutex) : mutex_(mutex) { xSemaphoreTake(mutex_, portMAX_DELAY); }
  ~Lock() { xSemaphoreGive(mutex_); }

 private:
  SemaphoreHandle_t mutex_;
};

}  // namespace

bool EventQueue::begin() {
  mutex_ = xSemaphoreCreateMutex();
  if (!LittleFS.begin(true)) return false;
  if (!LittleFS.exists(kQueuePath) && LittleFS.exists(kTempPath)) {
    LittleFS.rename(kTempPath, kQueuePath);
  }
  size_ = countLines();
  return true;
}

bool EventQueue::push(const std::string& event_json, bool droppable) {
  Lock lock(mutex_);
  if (droppable && size_ >= kMaxDroppableBacklog) return false;
  File file = LittleFS.open(kQueuePath, FILE_APPEND);
  if (!file) return false;
  file.print(event_json.c_str());
  file.print('\n');
  file.close();
  size_++;
  return true;
}

std::vector<std::string> EventQueue::peek(size_t max_events) {
  Lock lock(mutex_);
  std::vector<std::string> events;
  File file = LittleFS.open(kQueuePath, FILE_READ);
  if (!file) return events;
  while (file.available() && events.size() < max_events) {
    const String line = file.readStringUntil('\n');
    if (line.length() > 0) events.emplace_back(line.c_str());
  }
  file.close();
  return events;
}

void EventQueue::ackUpTo(uint64_t seq) {
  Lock lock(mutex_);
  File in = LittleFS.open(kQueuePath, FILE_READ);
  if (!in) return;
  File out = LittleFS.open(kTempPath, FILE_WRITE);
  size_t kept = 0;
  while (in.available()) {
    const String line = in.readStringUntil('\n');
    if (line.length() == 0) continue;
    const auto line_seq = parseSeq(line.c_str());
    if (line_seq && *line_seq <= seq) continue;
    out.print(line);
    out.print('\n');
    kept++;
  }
  in.close();
  out.close();
  LittleFS.remove(kQueuePath);
  LittleFS.rename(kTempPath, kQueuePath);
  size_ = kept;
}

size_t EventQueue::size() {
  Lock lock(mutex_);
  return size_;
}

size_t EventQueue::countLines() {
  File file = LittleFS.open(kQueuePath, FILE_READ);
  if (!file) return 0;
  size_t lines = 0;
  while (file.available()) {
    if (file.readStringUntil('\n').length() > 0) lines++;
  }
  file.close();
  return lines;
}

}  // namespace gota
