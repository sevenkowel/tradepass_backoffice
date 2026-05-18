/**
 * Curated list of countries for the Clients advanced-filter dropdown.
 *
 * Focused on forex-broker relevant markets — we seeded the dev DB from
 * a similar set (CN/HK/AE/GB/SG/US/VN/MY/...), so the dropdown order
 * mirrors operator expectations.
 *
 * Adding a country here makes it filterable. The country code shipped
 * to the API is the standard ISO-3166 alpha-2 (uppercase).
 */

export interface CountryOption {
  code: string; // ISO-3166 alpha-2 uppercase
  en: string;
  zh: string;
}

/**
 * Ordered: Asia/Pacific heavy markets first, then Middle East, Americas,
 * Europe, Africa, others. Matches the breakdown in our seed data.
 */
export const COUNTRIES: CountryOption[] = [
  // East / Southeast Asia — the bulk of our seeded volume
  { code: "CN", en: "China",           zh: "中国" },
  { code: "HK", en: "Hong Kong",       zh: "中国香港" },
  { code: "TW", en: "Taiwan",          zh: "中国台湾" },
  { code: "SG", en: "Singapore",       zh: "新加坡" },
  { code: "JP", en: "Japan",           zh: "日本" },
  { code: "KR", en: "South Korea",     zh: "韩国" },
  { code: "VN", en: "Vietnam",         zh: "越南" },
  { code: "TH", en: "Thailand",        zh: "泰国" },
  { code: "MY", en: "Malaysia",        zh: "马来西亚" },
  { code: "ID", en: "Indonesia",       zh: "印度尼西亚" },
  { code: "PH", en: "Philippines",     zh: "菲律宾" },
  { code: "IN", en: "India",           zh: "印度" },

  // Middle East
  { code: "AE", en: "United Arab Emirates", zh: "阿联酋" },
  { code: "SA", en: "Saudi Arabia",    zh: "沙特阿拉伯" },
  { code: "QA", en: "Qatar",           zh: "卡塔尔" },
  { code: "KW", en: "Kuwait",          zh: "科威特" },
  { code: "BH", en: "Bahrain",         zh: "巴林" },
  { code: "OM", en: "Oman",            zh: "阿曼" },
  { code: "IL", en: "Israel",          zh: "以色列" },
  { code: "TR", en: "Turkey",          zh: "土耳其" },

  // Americas
  { code: "US", en: "United States",   zh: "美国" },
  { code: "CA", en: "Canada",          zh: "加拿大" },
  { code: "MX", en: "Mexico",          zh: "墨西哥" },
  { code: "BR", en: "Brazil",          zh: "巴西" },
  { code: "AR", en: "Argentina",       zh: "阿根廷" },
  { code: "CL", en: "Chile",           zh: "智利" },
  { code: "CO", en: "Colombia",        zh: "哥伦比亚" },

  // Europe
  { code: "GB", en: "United Kingdom",  zh: "英国" },
  { code: "DE", en: "Germany",         zh: "德国" },
  { code: "FR", en: "France",          zh: "法国" },
  { code: "ES", en: "Spain",           zh: "西班牙" },
  { code: "IT", en: "Italy",           zh: "意大利" },
  { code: "NL", en: "Netherlands",     zh: "荷兰" },
  { code: "CH", en: "Switzerland",     zh: "瑞士" },
  { code: "SE", en: "Sweden",          zh: "瑞典" },
  { code: "NO", en: "Norway",          zh: "挪威" },
  { code: "DK", en: "Denmark",         zh: "丹麦" },
  { code: "FI", en: "Finland",         zh: "芬兰" },
  { code: "PL", en: "Poland",          zh: "波兰" },
  { code: "CZ", en: "Czech Republic",  zh: "捷克" },
  { code: "GR", en: "Greece",          zh: "希腊" },
  { code: "PT", en: "Portugal",        zh: "葡萄牙" },
  { code: "IE", en: "Ireland",         zh: "爱尔兰" },
  { code: "AT", en: "Austria",         zh: "奥地利" },
  { code: "BE", en: "Belgium",         zh: "比利时" },
  { code: "RU", en: "Russia",          zh: "俄罗斯" },
  { code: "UA", en: "Ukraine",         zh: "乌克兰" },

  // Oceania
  { code: "AU", en: "Australia",       zh: "澳大利亚" },
  { code: "NZ", en: "New Zealand",     zh: "新西兰" },

  // Africa
  { code: "ZA", en: "South Africa",    zh: "南非" },
  { code: "EG", en: "Egypt",           zh: "埃及" },
  { code: "NG", en: "Nigeria",         zh: "尼日利亚" },
  { code: "KE", en: "Kenya",           zh: "肯尼亚" },
  { code: "MA", en: "Morocco",         zh: "摩洛哥" },
];

/** O(1) lookup by code. */
const BY_CODE = new Map<string, CountryOption>(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code: string | undefined): CountryOption | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}

/** Localised display name; falls back to en, then code. */
export function countryName(code: string | undefined, locale: string): string {
  if (!code) return "";
  const c = BY_CODE.get(code.toUpperCase());
  if (!c) return code.toUpperCase();
  return locale === "zh" ? c.zh : c.en;
}
