#pragma once

#include <Arduino.h>

#include "event-detector.h"
#include "scale.h"

namespace gota {

struct ConsoleContext {
  Scale& scale;
  EventDetector& detector;
  bool& live;
};

void pollConsole(ConsoleContext& ctx);

}  // namespace gota
