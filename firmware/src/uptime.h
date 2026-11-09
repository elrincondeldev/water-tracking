#pragma once

#include <esp_timer.h>

#include <cstdint>

namespace gota {

inline uint64_t uptimeMs() { return static_cast<uint64_t>(esp_timer_get_time() / 1000); }

}  // namespace gota
