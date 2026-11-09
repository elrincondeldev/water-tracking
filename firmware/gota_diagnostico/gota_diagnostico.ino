// GOTA v2 - diagnostico de celula de carga + HX711 en ESP32-S3.
// Cableado (guia GOTA v2): HX711 VCC->3V3, GND->GND, DT/DOUT->GPIO4, SCK->GPIO5.
// Celula: rojo->E+, negro->E-, verde->A+, blanco->A-.
//
// Al arrancar hace un autodiagnostico (OK/FALLO) y luego muestra lecturas en vivo.
// Comandos por monitor serie (115200, "Nueva linea"):
//   d      repetir diagnostico
//   p      prueba de presion guiada (aprieta el extremo libre con el dedo)
//   t      cero con plato vacio
//   c 500  calibrar con masa conocida en gramos
//   s      silenciar / reanudar lecturas en vivo
//   ?      ayuda
// Guarda cero/factor en el mismo espacio Preferences que GOTA_prueba.ino,
// asi la calibracion sirve para ambos programas.
#include <Arduino.h>
#include <HX711.h>
#include <Preferences.h>
#include <math.h>

constexpr uint8_t PIN_DT = 4;
constexpr uint8_t PIN_SCK = 5;
constexpr long SATURADO = 8388600L;      // cerca de +-2^23
constexpr double RUIDO_MAX_OK = 3000.0;  // desviacion tipica en cuentas RAW (ganancia 128)

HX711 adc;
Preferences memoria;
long cero = 0;
float factor = 1.0f;
bool tieneCero = false;
bool calibrado = false;
bool guarda = false;
bool enVivo = true;
String linea;
uint32_t ultimaSalida = 0;

struct Stats {
  bool ok = false;
  uint16_t n = 0;
  double media = 0, desv = 0;
  long minimo = 0, maximo = 0;
  uint16_t saturadas = 0;
};

Stats muestrear(uint16_t n, uint32_t timeoutMs = 700) {
  Stats s;
  double suma = 0, suma2 = 0;
  s.minimo = LONG_MAX;
  s.maximo = LONG_MIN;
  for (uint16_t i = 0; i < n; ++i) {
    if (!adc.wait_ready_timeout(timeoutMs)) return s;
    const long v = adc.read();
    if (v <= -SATURADO || v >= SATURADO) s.saturadas++;
    suma += v;
    suma2 += static_cast<double>(v) * v;
    if (v < s.minimo) s.minimo = v;
    if (v > s.maximo) s.maximo = v;
    s.n++;
  }
  s.media = suma / s.n;
  s.desv = sqrt(fmax(0.0, suma2 / s.n - s.media * s.media));
  s.ok = true;
  return s;
}

void linea_ok(bool ok, const char *texto) {
  Serial.print(ok ? "  [OK]    " : "  [FALLO] ");
  Serial.println(texto);
}

bool diagnostico() {
  Serial.println();
  Serial.println("=== DIAGNOSTICO GOTA ===");
  bool todo = true;

  // 1. El HX711 responde (DT baja cuando hay conversion lista).
  const bool responde = adc.wait_ready_timeout(1500);
  linea_ok(responde, "HX711 responde en DT/GPIO4");
  if (!responde) {
    Serial.println("     -> Revisa VCC->3V3, GND->GND, DT->GPIO4 y SCK->GPIO5 (soldaduras).");
    Serial.println("=== RESULTADO: FALLO ===");
    return false;
  }

  // 2. Frecuencia de muestreo (~10 Hz con RATE a GND, ~80 Hz con RATE a VCC).
  const uint32_t t0 = millis();
  uint16_t lecturas = 0;
  while (millis() - t0 < 1000) {
    if (adc.wait_ready_timeout(300)) { adc.read(); lecturas++; }
  }
  const bool hzOk = lecturas >= 5;
  Serial.print(hzOk ? "  [OK]    " : "  [FALLO] ");
  Serial.print("Frecuencia: "); Serial.print(lecturas); Serial.println(" lecturas/s (normal 10 u 80)");
  if (!hzOk) { todo = false; Serial.println("     -> Conexion intermitente en DT/SCK o alimentacion."); }

  // 3. Calidad de la senal.
  const Stats s = muestrear(30);
  if (!s.ok) {
    linea_ok(false, "Lectura continua (se corto a mitad)");
    Serial.println("=== RESULTADO: FALLO ===");
    return false;
  }
  Serial.print("     RAW media="); Serial.print(s.media, 0);
  Serial.print("  ruido(desv)="); Serial.print(s.desv, 1);
  Serial.print("  min="); Serial.print(s.minimo);
  Serial.print("  max="); Serial.println(s.maximo);

  const bool sinSaturar = s.saturadas == 0;
  linea_ok(sinSaturar, "Senal no saturada");
  if (!sinSaturar) {
    todo = false;
    Serial.println("     -> Hilos de la celula sueltos o cruzados (E+/E- con A+/A-).");
  }

  const bool constante = s.desv == 0.0 && (s.minimo == 0 || s.minimo == -1);
  linea_ok(!constante, "Datos variables (SCK funciona)");
  if (constante) {
    todo = false;
    Serial.println("     -> Valor fijo 0/-1: revisa SCK->GPIO5.");
  }

  const bool ruidoOk = s.desv < RUIDO_MAX_OK;
  linea_ok(ruidoOk, "Ruido bajo (celula conectada)");
  if (!ruidoOk && sinSaturar) {
    todo = false;
    Serial.println("     -> Ruido alto: A+/A- flojos, o algo toca/vibra la celula.");
  }

  Serial.println(todo ? "=== RESULTADO: OK. Envia p para probar presion ===" : "=== RESULTADO: FALLO ===");
  return todo;
}

void pruebaPresion() {
  Serial.println();
  Serial.println("=== PRUEBA DE PRESION ===");
  Serial.println("No toques nada 2 s...");
  delay(500);
  const Stats base = muestrear(15);
  if (!base.ok) { Serial.println("SIN_DATOS"); return; }
  Serial.println(">>> AHORA presiona suavemente el extremo LIBRE de la celula (8 s) <<<");
  const uint32_t t0 = millis();
  double maxDelta = 0;
  while (millis() - t0 < 8000) {
    if (!adc.wait_ready_timeout(500)) continue;
    const double d = adc.read() - base.media;
    if (fabs(d) > fabs(maxDelta)) maxDelta = d;
  }
  Serial.println("Suelta. Comprobando que vuelve...");
  delay(1500);
  const Stats fin = muestrear(15);
  const double deriva = fin.ok ? fin.media - base.media : NAN;

  Serial.print("     Cambio maximo: "); Serial.print(maxDelta, 0);
  Serial.print(" cuentas  (ruido base "); Serial.print(base.desv, 1); Serial.println(")");
  Serial.print("     Diferencia al soltar: "); Serial.println(deriva, 0);

  const bool reacciona = fabs(maxDelta) > fmax(2000.0, 20 * base.desv);
  linea_ok(reacciona, "La celula reacciona a la fuerza");
  if (reacciona) {
    Serial.print("     Signo: "); Serial.println(maxDelta > 0 ? "positivo" : "negativo (normal, la calibracion lo compensa)");
  } else {
    Serial.println("     -> Revisa verde->A+ y blanco->A-, y que el extremo libre no toque el fondo.");
  }
  const bool vuelve = fin.ok && fabs(deriva) < fmax(1500.0, fabs(maxDelta) * 0.05);
  linea_ok(vuelve, "Vuelve al valor inicial al soltar");
  if (!vuelve) Serial.println("     -> Tornillos flojos o algo roza la celula.");
  Serial.println(reacciona && vuelve ? "=== CELULA OK: puedes seguir montando ===" : "=== REVISAR ===");
}

void ayuda() {
  Serial.println("Comandos: d=diagnostico  p=prueba presion  t=cero  c 500=calibrar  s=pausar  ?=ayuda");
}

void comando(String orden) {
  orden.trim();
  if (orden.length() == 0) return;
  if (orden == "?") { ayuda(); return; }
  if (orden == "d") { diagnostico(); return; }
  if (orden == "p") { pruebaPresion(); return; }
  if (orden == "s") { enVivo = !enVivo; Serial.println(enVivo ? "Lecturas en vivo ON" : "Lecturas en vivo OFF"); return; }
  if (orden == "t") {
    Serial.println("Tomando cero (plato vacio)...");
    const Stats s = muestrear(20);
    if (!s.ok) { Serial.println("ERROR: sin datos del HX711."); return; }
    cero = lround(s.media);
    tieneCero = true;
    if (guarda) { memoria.putLong("cero", cero); memoria.putBool("hayCero", true); }
    Serial.print("CERO_OK cero="); Serial.println(cero);
    return;
  }
  if (orden.startsWith("c ")) {
    if (!tieneCero) { Serial.println("Primero envia t con el plato vacio."); return; }
    const float gramos = orden.substring(2).toFloat();
    if (!isfinite(gramos) || gramos <= 0) { Serial.println("Uso: c 500"); return; }
    Serial.println("Calibrando, no toques la masa...");
    const Stats s = muestrear(20);
    if (!s.ok) { Serial.println("ERROR: sin datos del HX711."); return; }
    const double cambio = s.media - cero;
    if (fabs(cambio) < 100.0) { Serial.println("ERROR: cambio insuficiente."); return; }
    factor = cambio / gramos;
    calibrado = true;
    if (guarda) { memoria.putFloat("factor", factor); memoria.putBool("cal", true); }
    Serial.print("CALIBRACION_OK factor="); Serial.println(factor, 6);
    return;
  }
  Serial.println("Comando desconocido.");
  ayuda();
}

void setup() {
  Serial.begin(115200);
  const uint32_t t0 = millis();
  while (!Serial && millis() - t0 < 3000) delay(10);
  delay(300);
  adc.begin(PIN_DT, PIN_SCK, 128);
  guarda = memoria.begin("gota-prueba", false);
  if (guarda) {
    cero = memoria.getLong("cero", 0);
    factor = memoria.getFloat("factor", 1.0f);
    tieneCero = memoria.getBool("hayCero", false);
    calibrado = memoria.getBool("cal", false) && tieneCero && isfinite(factor) && factor != 0;
  }
  Serial.println();
  Serial.println("GOTA v2 - DIAGNOSTICO celula + HX711 (DT=GPIO4, SCK=GPIO5)");
  Serial.println(calibrado ? "Calibracion guardada encontrada." : "Sin calibrar: se muestra RAW.");
  diagnostico();
  ayuda();
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
  if (!enVivo || millis() - ultimaSalida < 500) return;
  ultimaSalida = millis();
  const Stats s = muestrear(5);
  if (!s.ok) { Serial.println("SIN_DATOS: revisa 3V3, GND, DT/GPIO4, SCK/GPIO5"); return; }
  Serial.print("RAW="); Serial.print(s.media, 0);
  Serial.print("  ruido="); Serial.print(s.desv, 0);
  if (tieneCero) { Serial.print("  delta="); Serial.print(s.media - cero, 0); }
  if (calibrado) { Serial.print("  PESO_g="); Serial.print((s.media - cero) / factor, 1); }
  if (s.saturadas) Serial.print("  SATURADO!");
  Serial.println();
}
