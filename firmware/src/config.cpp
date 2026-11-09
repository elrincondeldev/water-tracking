#include "config.h"

#include <Preferences.h>

namespace gota {

namespace {

struct Key {
  const char* name;
  const char* nvs_key;
  String Config::* field;
  bool secret;
};

constexpr Key kKeys[] = {
    {"wifi.ssid", "wifi_ssid", &Config::wifi_ssid, false},
    {"wifi.pass", "wifi_pass", &Config::wifi_pass, true},
    {"api.url", "api_url", &Config::api_url, false},
    {"api.token", "api_token", &Config::api_token, true},
};

}  // namespace

Config loadConfig() {
  Preferences prefs;
  prefs.begin("config", false);
  Config config;
  for (const Key& key : kKeys) {
    if (prefs.isKey(key.nvs_key)) config.*key.field = prefs.getString(key.nvs_key);
  }
  prefs.end();
  return config;
}

SetResult setConfigValue(const String& name, const String& value) {
  for (const Key& key : kKeys) {
    if (name != key.name) continue;
    Preferences prefs;
    prefs.begin("config", false);
    prefs.putString(key.nvs_key, value);
    prefs.end();
    return SetResult::Ok;
  }
  return SetResult::UnknownKey;
}

void printConfig(const Config& config) {
  for (const Key& key : kKeys) {
    const String& value = config.*key.field;
    const char* shown = value.isEmpty() ? "(not set)" : key.secret ? "(set)" : value.c_str();
    Serial.printf("#   %-10s %s\n", key.name, shown);
  }
}

}  // namespace gota
