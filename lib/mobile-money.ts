const mobileMoneyProviders: Record<string, string[]> = {
  BJ: ["MTN MoMo", "Moov Money"],
  BF: ["Orange Money", "Moov Money"],
  CM: ["MTN MoMo", "Orange Money"],
  CD: ["M-Pesa", "Orange Money", "Airtel Money"],
  CG: ["MTN MoMo", "Airtel Money"],
  CI: ["Orange Money", "MTN MoMo", "Wave"],
  EG: ["Vodafone Cash", "Orange Cash", "Etisalat Cash"],
  ET: ["Telebirr"],
  GH: ["MTN Mobile Money", "Telecel Cash", "AT Money"],
  GN: ["Orange Money", "MTN Mobile Money"],
  IN: ["UPI"],
  KE: ["M-Pesa"],
  ML: ["Orange Money", "Moov Money"],
  MA: ["Orange Money", "inwi money"],
  MW: ["Airtel Money", "TNM Mpamba"],
  MZ: ["M-Pesa", "e-Mola"],
  NG: ["Paga", "OPay"],
  RW: ["MTN Mobile Money", "Airtel Money"],
  SN: ["Wave", "Orange Money"],
  ZA: ["MTN MoMo", "Vodafone Cash"],
  TZ: ["M-Pesa", "Tigo Pesa", "Airtel Money"],
  TG: ["TMoney", "Flooz"],
  UG: ["MTN Mobile Money", "Airtel Money"],
  ZM: ["MTN MoMo", "Airtel Money", "Zamtel Kwacha"],
};

export function getMobileMoneyProviders(countryIsoCode: string) {
  return mobileMoneyProviders[countryIsoCode.toUpperCase()] ?? [];
}
