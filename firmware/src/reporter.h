#pragma once

#include "config.h"
#include "event-queue.h"
#include "wall-clock.h"

namespace gota {

void startReporter(const Config& config, EventQueue& queue, WallClock& clock,
                   uint64_t boot_first_seq);

}  // namespace gota
