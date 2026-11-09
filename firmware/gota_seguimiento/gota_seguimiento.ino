// GOTA v2 - seguimiento de consumo de agua (local, sin Wi-Fi todavia).
// Cableado: HX711 VCC->3V3, GND->GND, DT->GPIO4, SCK->GPIO5.
//
// Como funciona:
//   - Lee la bascula ~10 veces/s y solo decide con lecturas estables.
//   - Cuando la botella se levanta y vuelve, compara su peso con el anterior:
//       baja  -> "sorbo"   (1 g de agua = 1 ml) y se suma al total
//       sube  -> "recarga" (no se suma)
//       baja mas de SORBO_MAX_G -> "descarte" (vaciado o cambio de botella)
//   - Un cambio sostenido sin levantar la botella (p. ej. rellenar en el sitio)
//     tambien se evalua tras CONFIRMA_EN_SITIO_MS.
//   - Total, numero de sorbos y peso de referencia se guardan en memoria:
//     sobreviven a reinicios. Si se bebe con el aparato apagado, se cuenta al
//     arrancar.
//
// Salida serie (115200): eventos en JSON, una linea cada uno; mensajes para
// personas empiezan por "#". Pensado para que la fase Wi-Fi/ZimaBoard los
// reenvie tal cual.
//
// Comandos: e=estado  r=reiniciar total del dia  t=cero (plato vacio)
//           c 1531=calibrar con masa conocida  v=ver peso en vivo  ?=ayuda
// Usa la calibracion guardada por gota_diagnostico / GOTA_prueba.
#include <Arduino.h>
#include <HX711.h>
#include <Preferences.h>
#include <math.h>

constexpr uint8_t PIN_DT = 4;
constexpr uint8_t PIN_SCK = 5;

constexpr uint8_t N_VENTANA = 12;              // ~1 s de lecturas
constexpr float ESTABLE_G = 3.0f;              // max-min permitido en la ventana
constexpr uint32_t CONFIRMA_MS = 1500;         // estable este tiempo -> decidir
constexpr uint32_t CONFIRMA_EN_SITIO_MS = 5000;
constexpr float PRESENCIA_G = 100.0f;          // por encima hay botella
constexpr float CAMBIO_MIN_G = 5.0f;           // ignora cambios menores
constexpr float SORBO_MAX_G = 600.0f;          // bajadas mayores no se cuentan
constexpr float CERO_AUTO_G = 4.0f;            // corrige deriva del cero en vacio

HX711 adc;
Preferences memCal;  // "gota-prueba": cero/factor compartidos con el diagnostico
Preferences memSeg;  // "gota-seg": estado del seguimiento

long cero = 0;
float factor = 1.0f;
bool calibrado = false;

float ventanaG[N_VENTANA];
long ventanaRaw[N_VENTANA];
uint8_t idx = 0, llenas = 0;

enum Estado { DESCONOCIDO, VACIO, CON_BOTELLA };
Estado estado = DESCONOCIDO;
bool levantada = true;  // true al arrancar: compara con la referencia guardada
float pesoRef = 0;
bool hayRef = false;
float totalMl = 0;
uint32_t nSorbos = 0;

uint32_t estableDesde = 0;
float pesoActual = 0;
bool estable = false;
bool verbose = false;
uint32_t ultimoVerbose = 0;
String linea;

void guardarSeg() {
  memSeg.putFloat("ref", pesoRef);
  memSeg.putBool("hayRef", hayRef);
  memSeg.putFloat("total", totalMl);
  memSeg.putUInt("n", nSorbos);
}

void evento(const char *tipo, float ml = NAN) {
  Serial.printf("{\"ev\":\"%s\"", tipo);
  if (!isnan(ml)) Serial.printf(",\"ml\":%.0f", ml);
  Serial.printf(",\"peso_g\":%.1f,\"total_ml\":%.0f,\"sorbos\":%lu,\"t_ms\":%lu}\n",
                pesoActual, totalMl, (unsigned long)nSorbos, (unsigned long)millis());
}

void procesarLlegada(float peso) {
  if (!hayRef) {
    pesoRef = peso;
    hayRef = true;
    guardarSeg();
    evento("botella_nueva");
    return;
  }
  const float diff = peso - pesoRef;
  if (fabs(diff) < CAMBIO_MIN_G) {
    evento("sin_cambio");
  } else if (diff < 0 && -diff <= SORBO_MAX_G) {
    totalMl += -diff;
    nSorbos++;
    evento("sorbo", -diff);
  } else if (diff < 0) {
    evento("descarte", -diff);  // vaciado o botella distinta: no cuenta
  } else {
    evento("recarga", diff);
  }
  pesoRef = peso;
  guardarSeg();
}

void decidir(float peso, long raw) {
  if (peso < PRESENCIA_G) {
    if (estado == CON_BOTELLA) evento("botella_retirada");
    estado = VACIO;
    levantada = true;
    // Seguimiento lento del cero mientras el plato esta vacio.
    if (fabs(peso) < CERO_AUTO_G) cero += lround((raw - cero) * 0.02);
    return;
  }
  if (estado != CON_BOTELLA || levantada) {
    estado = CON_BOTELLA;
    levantada = false;
    procesarLlegada(peso);
    return;
  }
  // Botella sin levantar: cambio sostenido (rellenar en el sitio, etc.).
  if (fabs(peso - pesoRef) >= CAMBIO_MIN_G &&
      millis() - estableDesde >= CONFIRMA_EN_SITIO_MS) {
    procesarLlegada(peso);
  }
}

bool mediaVentana(float &g, long &raw) {
  if (llenas < N_VENTANA) return false;
  double sg = 0, sr = 0;
  for (uint8_t i = 0; i < N_VENTANA; ++i) { sg += ventanaG[i]; sr += ventanaRaw[i]; }
  g = sg / N_VENTANA;
  raw = lround(sr / N_VENTANA);
  return true;
}

void ayuda() {
  Serial.println("# Comandos: e=estado  r=reiniciar total  t=cero (plato vacio)  c 1531=calibrar  v=peso en vivo  ?=ayuda");
}

void comando(String orden) {
  orden.trim();
  if (orden.length() == 0) return;
  float g; long raw;
  if (orden == "?") { ayuda(); return; }
  if (orden == "v") { verbose = !verbose; Serial.println(verbose ? "# vivo ON" : "# vivo OFF"); return; }
  if (orden == "e") {
    char ref[16] = "null";
    if (hayRef) snprintf(ref, sizeof(ref), "%.1f", pesoRef);
    Serial.printf("{\"ev\":\"estado\",\"peso_g\":%.1f,\"estable\":%s,\"botella\":%s,\"ref_g\":%s,"
                  "\"total_ml\":%.0f,\"sorbos\":%lu,\"calibrado\":%s,\"factor\":%.4f}\n",
                  pesoActual, estable ? "true" : "false", estado == CON_BOTELLA ? "true" : "false",
                  ref, totalMl, (unsigned long)nSorbos, calibrado ? "true" : "false", factor);
    return;
  }
  if (orden == "r") {
    totalMl = 0;
    nSorbos = 0;
    guardarSeg();
    evento("reinicio_total");
    return;
  }
  if (orden == "t") {
    if (!estable || !mediaVentana(g, raw)) { Serial.println("# ERROR: espera a que el peso este estable."); return; }
    if (calibrado && g > PRESENCIA_G) { Serial.println("# ERROR: retira la botella antes del cero."); return; }
    cero = raw;
    memCal.putLong("cero", cero);
    memCal.putBool("hayCero", true);
    Serial.println("# CERO_OK");
    return;
  }
  if (orden.startsWith("c ")) {
    const float masa = orden.substring(2).toFloat();
    if (!isfinite(masa) || masa <= 0) { Serial.println("# Uso: c 1531"); return; }
    if (!estable || !mediaVentana(g, raw)) { Serial.println("# ERROR: espera a que el peso este estable."); return; }
    const double cambio = static_cast<double>(raw) - cero;
    if (fabs(cambio) < 100.0) { Serial.println("# ERROR: cambio insuficiente; pon la masa."); return; }
    factor = cambio / masa;
    calibrado = true;
    memCal.putFloat("factor", factor);
    memCal.putBool("cal", true);
    // La referencia anterior estaba en otra escala: se toma de nuevo.
    hayRef = false;
    levantada = true;
    estado = DESCONOCIDO;
    guardarSeg();
    llenas = 0;
    Serial.printf("# CALIBRACION_OK factor=%.6f\n", factor);
    return;
  }
  Serial.println("# Comando desconocido.");
  ayuda();
}

void setup() {
  Serial.begin(115200);
  const uint32_t t0 = millis();
  while (!Serial && millis() - t0 < 2000) delay(10);
  adc.begin(PIN_DT, PIN_SCK, 128);

  memCal.begin("gota-prueba", false);
  cero = memCal.getLong("cero", 0);
  factor = memCal.getFloat("factor", 1.0f);
  calibrado = memCal.getBool("cal", false) && memCal.getBool("hayCero", false) &&
              isfinite(factor) && factor != 0;

  memSeg.begin("gota-seg", false);
  pesoRef = memSeg.getFloat("ref", 0);
  hayRef = memSeg.getBool("hayRef", false);
  totalMl = memSeg.getFloat("total", 0);
  nSorbos = memSeg.getUInt("n", 0);

  Serial.println("# GOTA v2 - seguimiento de consumo");
  if (!calibrado) Serial.println("# AVISO: sin calibrar. Plato vacio -> t; luego masa conocida -> c <gramos>.");
  ayuda();
  evento("inicio");
}

void loop() {
  while (Serial.available()) {
    const char ch = static_cast<char>(Serial.read());
    if (ch == '\n' || ch == '\r') {
      if (linea.length()) { comando(linea); linea = ""; }
    } else if (linea.length() < 40) {
      linea += ch;
    }
  }

  if (!adc.is_ready()) return;
  const long raw = adc.read();
  const float g = (static_cast<double>(raw) - cero) / factor;
  ventanaG[idx] = g;
  ventanaRaw[idx] = raw;
  idx = (idx + 1) % N_VENTANA;
  if (llenas < N_VENTANA) llenas++;
  if (calibrado && g < PRESENCIA_G) levantada = true;  // basta una lectura sin botella

  float media; long mediaRaw;
  if (!mediaVentana(media, mediaRaw)) return;
  float mn = ventanaG[0], mx = ventanaG[0];
  for (uint8_t i = 1; i < N_VENTANA; ++i) { mn = fmin(mn, ventanaG[i]); mx = fmax(mx, ventanaG[i]); }
  pesoActual = media;
  const bool ahoraEstable = (mx - mn) < ESTABLE_G;
  if (ahoraEstable && !estable) estableDesde = millis();
  estable = ahoraEstable;

  if (verbose && millis() - ultimoVerbose >= 1000) {
    ultimoVerbose = millis();
    Serial.printf("# peso=%.1f g %s\n", media, estable ? "estable" : "moviendo");
  }

  if (calibrado && estable && millis() - estableDesde >= CONFIRMA_MS) decidir(media, mediaRaw);
}
