export const fmtMoney = (n: number, currency = "CAD", locale = "fr-CA") =>
  n.toLocaleString(locale, { style: "currency", currency })

export const fmtQty = (n: number, max = 2, locale = "fr-CA") =>
  n.toLocaleString(locale, { maximumFractionDigits: max })

export const fmtPercent = (n: number, digits = 1, locale = "fr-CA") =>
  (n / 100).toLocaleString(locale, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits })
