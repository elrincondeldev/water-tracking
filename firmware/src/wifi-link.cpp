#include "wifi-link.h"

#include <WiFi.h>
#include <esp_mac.h>

namespace gota {

namespace {

String device_id;

String macDeviceId() {
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char id[18];
  snprintf(id, sizeof(id), "gota-%02x%02x%02x%02x%02x%02x", mac[0], mac[1], mac[2], mac[3],
           mac[4], mac[5]);
  return id;
}

}  // namespace

void beginNetwork(const Config& config) {
  WiFi.mode(WIFI_STA);
  device_id = macDeviceId();
  WiFi.setHostname(device_id.c_str());
  WiFi.setAutoReconnect(true);
  if (config.wifi_ssid.isEmpty()) {
    Serial.println("# Wi-Fi not configured: set wifi.ssid and wifi.pass, then reboot.");
    return;
  }
  WiFi.begin(config.wifi_ssid.c_str(), config.wifi_pass.c_str());
  Serial.printf("# Connecting to Wi-Fi \"%s\"\n", config.wifi_ssid.c_str());
}

bool networkConnected() { return WiFi.status() == WL_CONNECTED; }

int networkRssiDbm() { return networkConnected() ? WiFi.RSSI() : 0; }

const String& deviceId() { return device_id; }

}  // namespace gota
