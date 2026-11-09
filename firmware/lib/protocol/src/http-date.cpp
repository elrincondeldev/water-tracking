#include "http-date.h"

#include <cstdio>
#include <cstring>

namespace gota {

namespace {

constexpr const char* kMonths = "JanFebMarAprMayJunJulAugSepOctNovDec";

int64_t daysFromCivil(int64_t year, unsigned month, unsigned day) {
  year -= month <= 2;
  const int64_t era = (year >= 0 ? year : year - 399) / 400;
  const unsigned year_of_era = static_cast<unsigned>(year - era * 400);
  const unsigned day_of_year = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
  const unsigned day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
  return era * 146097 + static_cast<int64_t>(day_of_era) - 719468;
}

}  // namespace

std::optional<uint64_t> parseHttpDateMs(const std::string& date) {
  char weekday[4];
  char month_name[4];
  char zone[4];
  int day;
  int year;
  int hour;
  int minute;
  int second;
  if (std::sscanf(date.c_str(), "%3s, %d %3s %d %d:%d:%d %3s", weekday, &day, month_name, &year,
                  &hour, &minute, &second, zone) != 8) {
    return std::nullopt;
  }
  const char* found = std::strstr(kMonths, month_name);
  if (found == nullptr || std::strlen(month_name) != 3 || std::strcmp(zone, "GMT") != 0) {
    return std::nullopt;
  }
  const unsigned month = static_cast<unsigned>((found - kMonths) / 3 + 1);
  if (day < 1 || day > 31 || hour > 23 || minute > 59 || second > 60 || year < 2020) {
    return std::nullopt;
  }
  const int64_t days = daysFromCivil(year, month, static_cast<unsigned>(day));
  const int64_t seconds = days * 86400 + hour * 3600 + minute * 60 + second;
  return static_cast<uint64_t>(seconds) * 1000;
}

}  // namespace gota
