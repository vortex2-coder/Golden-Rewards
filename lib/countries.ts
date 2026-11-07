import countries from "i18n-iso-countries";
import englishLocale from "i18n-iso-countries/langs/en.json";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

countries.registerLocale(englishLocale);

const phoneRegions = new Set<string>(getCountries());

export const phoneCountries = Object.keys(countries.getAlpha2Codes())
  .filter((countryCode) => countryCode !== "XK")
  .map((countryCode) => ({
    code: countryCode,
    name: countries.getName(countryCode, "en") ?? countryCode,
    dialCode: phoneRegions.has(countryCode)
      ? `+${getCountryCallingCode(countryCode as CountryCode)}`
      : "",
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

export function countryFlag(countryCode: string) {
  return [...countryCode.toUpperCase()]
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}
