# Hardware

The node is a coaster: a 3D-printed base holding a single-point load cell, an HX711 ADC and an ESP32-S3. A floating cover sits on the load cell and carries the bottle.

## Parts

| Part | Notes |
|---|---|
| ESP32-S3 DevKit | Generic board with native USB (VID `0x303A`). |
| HX711 module | 24-bit load cell ADC, channel A, gain 128, ~10 Hz (RATE pin to GND). |
| Load cell | 10 kg single-point (bar) cell, four wires. |
| 3D-printed base and cover | The base holds the electronics and the fixed end of the cell; the cover floats on the free end. |
| USB-C cable and 5 V supply | Powers the ESP32-S3; the HX711 is fed from the board's 3.3 V. |

## Wiring

```
Load cell            HX711             ESP32-S3
red    ──────────── E+
black  ──────────── E−
green  ──────────── A+
white  ──────────── A−
                    VCC ────────────── 3V3
                    GND ────────────── GND
                    DT (DOUT) ──────── GPIO4
                    SCK ────────────── GPIO5
```

- **Power the HX711 from 3V3, never from 5V.** Its DOUT swings to its supply voltage, and ESP32-S3 GPIOs are not 5 V tolerant.
- Some cells use other wire colors. If the sign is inverted (weight reads negative), that is fine: calibration absorbs it. If readings saturate or stay flat, E± and A± are probably swapped.

## Assembly

- Screw the fixed end of the load cell to the base and the free end to the cover. The arrow on the cell, if any, points in the direction of the load (down).
- The cover must float: it touches only the load cell. Leave a visible gap between the cover and the base walls all around, and make sure no wire or screw head touches the cover or the free end of the cell.
- Tighten all four cell screws. A loose screw shows up as readings that don't return to zero after a lift.

### Five-position test

Run it after any mechanical change, before calibrating. Place the same full bottle at the center, front, back, left and right of the cover and note the stable weight each time.

- **Pass:** all five within ±2 g of each other.
- **Fail:** a larger spread (the prototype once showed 90 g) means something rubs the cover and absorbs part of the load. Fix the mechanics; calibrating now would store a wrong factor.

## Calibration

Calibration turns raw HX711 counts into grams: `weight_g = (raw − zero) / factor`. Both values live in the ESP32's NVS (non-volatile storage), survive reboots and normal flashing (not a full flash erase), and are never hardcoded. The prototype's factor was ~203.8 counts/g; every cell is different.

Opening the serial monitor resets the ESP32-S3, so expect a reboot when you connect.

1. **Mechanics first.** Pass the five-position test above.
2. **Connect** at 115200 baud: `pio device monitor -b 115200`.
3. **Tare** with the plate empty: send `t`. The node stores the current raw reading as zero. It never tares by itself at boot, because the bottle might be on the plate.
4. **Calibrate** with a known mass, ideally close to a full bottle (e.g. a 1.5 L bottle weighed on a kitchen scale): place it, wait for the reading to settle, then send `c <grams>`, e.g. `c 1531`.
5. **Verify:** remove and replace the mass a few times. It should read within 1 g of the reference, and the empty plate should return to 0 ± 1 g.

Re-tare whenever the empty plate drifts more than a few grams; re-calibrate after any mechanical change.

The commands above are those of the Phase 0 prototype sketches (`firmware/gota_diagnostico`, `firmware/gota_seguimiento`). Phase 3 ports them to the PlatformIO firmware and updates this section if anything changes.

## Reference measurements (Phase 0)

| Measurement | Value |
|---|---|
| Noise at rest | ~40 counts (~0.2 g) |
| 1531 g reference | reads 1530.3–1531.2 g |
| Position error | ±2 g across the five positions |
| Empty plate after lifts | 0 ± 0.6 g |

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| No data from the HX711 | VCC, GND, DT → GPIO4 or SCK → GPIO5 not connected; check the solder joints. |
| Constant 0 or −1 | SCK not reaching the HX711. |
| Saturated readings (near ±8,388,607) | Cell wires loose or E± swapped with A±. |
| High noise | A+/A− loose, or something touches or vibrates the cell. |
| Weight depends on bottle position | The cover rubs the base. See the five-position test. |
| Doesn't return to zero after a lift | Loose cell screws, or something rubs. |
| Board stuck at `waiting for download` after flashing | Press RESET, or run `esptool --chip esp32s3 -p <port> --after watchdog-reset read-mac`. |
| Board won't take a first flash | Manual download mode: hold BOOT, tap RESET, release BOOT. |
