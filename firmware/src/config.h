#pragma once

#include <Arduino.h>

namespace gota {

struct Config {
  String wifi_ssid;
  String wifi_pass;
  String api_url;
  String api_token;
};

enum class SetResult { Ok, UnknownKey };

Config loadConfig();
SetResult setConfigValue(const String& key, const String& value);
void printConfig(const Config& config);

}  // namespace gota
