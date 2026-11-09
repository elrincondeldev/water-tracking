#pragma once

#include <cstdint>
#include <optional>
#include <string>

namespace gota {

// Parses an IMF-fixdate such as "Mon, 09 Nov 2026 19:22:40 GMT" into Unix ms.
std::optional<uint64_t> parseHttpDateMs(const std::string& date);

}  // namespace gota
