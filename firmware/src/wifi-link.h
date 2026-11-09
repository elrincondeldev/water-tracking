#pragma once

#include <Arduino.h>

#include "config.h"

namespace gota {

void beginNetwork(const Config& config);
void maintainNetwork(uint32_t now_ms);
bool networkConnected();
int networkRssiDbm();
const String& deviceId();
void printNetworkScan();

}  // namespace gota
