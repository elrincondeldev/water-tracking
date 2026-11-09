#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include <string>
#include <vector>

namespace gota {

class EventQueue {
 public:
  bool begin();
  bool push(const std::string& event_json, bool droppable);
  std::vector<std::string> peek(size_t max_events);
  void ackUpTo(uint64_t seq);
  size_t size();

 private:
  size_t countLines();

  SemaphoreHandle_t mutex_ = nullptr;
  size_t size_ = 0;
};

}  // namespace gota
