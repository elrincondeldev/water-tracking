#include "wifi-link.h"

#include <WiFi.h>
#include <esp_mac.h>

namespace gota {

namespace {

String device_id;
uint8_t last_disconnect_reason = 0;

void logWifiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
    last_disconnect_reason = 0;
    Serial.printf("# Wi-Fi connected, IP %s\n", IPAddress(info.got_ip.ip_info.ip.addr).toString().c_str());
  } else if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    const uint8_t reason = info.wifi_sta_disconnected.reason;
    // Auto-reconnect reports STA_LEAVING between attempts; it hides the real cause.
    if (reason == WIFI_REASON_STA_LEAVING || reason == last_disconnect_reason) return;
    last_disconnect_reason = reason;
    Serial.printf("# Wi-Fi disconnected: %s (reason %u)\n",
                  WiFi.disconnectReasonName(static_cast<wifi_err_reason_t>(reason)), reason);
  }
}

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
  WiFi.onEvent(logWifiEvent);
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

void printNetworkScan() {
  const int count = WiFi.scanNetworks();
  if (count <= 0) {
    Serial.println("# No 2.4 GHz networks found.");
    return;
  }
  for (int i = 0; i < count; ++i) {
    Serial.printf("#   %4d dBm  ch %2d  %s\n", WiFi.RSSI(i), WiFi.channel(i), WiFi.SSID(i).c_str());
  }
  WiFi.scanDelete();
}

}  // namespace gota
