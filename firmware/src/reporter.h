#pragma once

#include "config.h"
#include "event-queue.h"
#include "wall-clock.h"

namespace gota {

void startReporter(const Config& config, EventQueue& queue, WallClock& clock);

}  // namespace gota
