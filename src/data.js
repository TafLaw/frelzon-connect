export const BASE_PRICES = {
  "iPhone XR|64GB": 4999,      "iPhone XR|128GB": 5499,
  "iPhone 11|64GB": 5999,      "iPhone 11|128GB": 6499,
  "iPhone 11 Pro|64GB": 6799,  "iPhone 11 Pro|256GB": 7499,
  "iPhone 11 Pro Max|64GB": 7499, "iPhone 11 Pro Max|256GB": 7999,
  "iPhone 12|64GB": 6799,      "iPhone 12|128GB": 7199,
  "iPhone 12 Pro|128GB": 8499, "iPhone 12 Pro|256GB": 8999,
  "iPhone 12 Pro Max|128GB": 9499, "iPhone 12 Pro Max|256GB": 9999, "iPhone 12 Pro Max|512GB": 10499,
  "iPhone 13|128GB": 9499,     "iPhone 13|256GB": 10499,
  "iPhone 13 Pro|128GB": 11499,"iPhone 13 Pro|256GB": 12499,
  "iPhone 13 Pro Max|128GB": 12499,"iPhone 13 Pro Max|256GB": 13499,"iPhone 13 Pro Max|512GB": 13999,
  "iPhone 14|128GB": 10999,    "iPhone 14|256GB": 11999,
  "iPhone 14 Plus|128GB": 11499,"iPhone 14 Plus|256GB": 12499,
  "iPhone 14 Pro|128GB": 12499,"iPhone 14 Pro|256GB": 13499,"iPhone 14 Pro|512GB": 13999,
  "iPhone 14 Pro Max|128GB": 13499,"iPhone 14 Pro Max|256GB": 14499,"iPhone 14 Pro Max|512GB": 14999,"iPhone 14 Pro Max|1TB": 15499,
  "iPhone 15|128GB": 13499,    "iPhone 15|256GB": 14499,
  "iPhone 15 Plus|128GB": 13999,"iPhone 15 Plus|256GB": 14999,
  "iPhone 15 Pro|128GB": 14499,"iPhone 15 Pro|256GB": 15499,
  "iPhone 15 Pro Max|256GB": 16999,"iPhone 15 Pro Max|512GB": 17999,"iPhone 15 Pro Max|1TB": 18499,
  "iPhone 16|128GB": 15499,    "iPhone 16|256GB": 16499,
  "iPhone 16e|128GB": 14999,
  "iPhone 16 Plus|128GB": 15999,"iPhone 16 Plus|256GB": 16999,
  "iPhone 16 Pro|128GB": 16499,"iPhone 16 Pro|256GB": 17499,
  "iPhone 16 Pro Max|256GB": 18499,"iPhone 16 Pro Max|512GB": 19499,
};

export const RESELLERS = [
  { id: "direct",      name: "Frelzon Connect",       subtitle: "Buy directly from us",       markup: 1.00, badge: "Best Price", location: "Nationwide" },
  { id: "techzone",    name: "TechZone Soweto",        subtitle: "Soweto, Gauteng",             markup: 1.05, badge: null,         location: "Soweto" },
  { id: "ihub",        name: "iHub Cape Town",          subtitle: "Cape Town, Western Cape",     markup: 1.06, badge: null,         location: "Cape Town" },
  { id: "gadgetworld", name: "GadgetWorld Durban",      subtitle: "Durban, KZN",                 markup: 1.07, badge: null,         location: "Durban" },
  { id: "smartphones", name: "SmartPhones JHB",         subtitle: "Johannesburg CBD",            markup: 1.04, badge: null,         location: "Johannesburg" },
  { id: "connectpro",  name: "ConnectPro Pretoria",     subtitle: "Pretoria, Gauteng",           markup: 1.05, badge: null,         location: "Pretoria" },
  { id: "mobileking",  name: "MobileKing East London",  subtitle: "East London, Eastern Cape",   markup: 1.08, badge: null,         location: "East London" },
  { id: "digistore",   name: "DigiStore Bloemfontein",  subtitle: "Bloemfontein, Free State",    markup: 1.06, badge: null,         location: "Bloemfontein" },
];

export const INVENTORY = [
  // iPhone 16 Series
  { id: 1,  series: "iPhone 16", model: "iPhone 16",        storage: "128GB", status: "in-stock",  qty: 14, restockIn: null },
  { id: 2,  series: "iPhone 16", model: "iPhone 16",        storage: "256GB", status: "low-stock", qty: 3,  restockIn: null },
  { id: 3,  series: "iPhone 16", model: "iPhone 16 Plus",   storage: "128GB", status: "in-stock",  qty: 8,  restockIn: null },
  { id: 4,  series: "iPhone 16", model: "iPhone 16 Plus",   storage: "256GB", status: "sold-out",  qty: 0,  restockIn: "~2 weeks" },
  { id: 5,  series: "iPhone 16", model: "iPhone 16e",       storage: "128GB", status: "in-stock",  qty: 22, restockIn: null },
  { id: 6,  series: "iPhone 16", model: "iPhone 16 Pro",    storage: "128GB", status: "sold-out",  qty: 0,  restockIn: "~3 weeks" },
  { id: 7,  series: "iPhone 16", model: "iPhone 16 Pro",    storage: "256GB", status: "low-stock", qty: 2,  restockIn: null },
  { id: 8,  series: "iPhone 16", model: "iPhone 16 Pro Max",storage: "256GB", status: "sold-out",  qty: 0,  restockIn: "~3 weeks" },
  { id: 9,  series: "iPhone 16", model: "iPhone 16 Pro Max",storage: "512GB", status: "sold-out",  qty: 0,  restockIn: "~4 weeks" },
  // iPhone 15 Series
  { id: 10, series: "iPhone 15", model: "iPhone 15",        storage: "128GB", status: "in-stock",  qty: 18, restockIn: null },
  { id: 11, series: "iPhone 15", model: "iPhone 15",        storage: "256GB", status: "in-stock",  qty: 9,  restockIn: null },
  { id: 12, series: "iPhone 15", model: "iPhone 15 Plus",   storage: "128GB", status: "low-stock", qty: 4,  restockIn: null },
  { id: 13, series: "iPhone 15", model: "iPhone 15 Plus",   storage: "256GB", status: "in-stock",  qty: 7,  restockIn: null },
  { id: 14, series: "iPhone 15", model: "iPhone 15 Pro",    storage: "128GB", status: "in-stock",  qty: 11, restockIn: null },
  { id: 15, series: "iPhone 15", model: "iPhone 15 Pro",    storage: "256GB", status: "low-stock", qty: 2,  restockIn: null },
  { id: 16, series: "iPhone 15", model: "iPhone 15 Pro Max",storage: "256GB", status: "in-stock",  qty: 5,  restockIn: null },
  { id: 17, series: "iPhone 15", model: "iPhone 15 Pro Max",storage: "512GB", status: "sold-out",  qty: 0,  restockIn: "~2 weeks" },
  { id: 18, series: "iPhone 15", model: "iPhone 15 Pro Max",storage: "1TB",   status: "sold-out",  qty: 0,  restockIn: "~5 weeks" },
  // iPhone 14 Series
  { id: 19, series: "iPhone 14", model: "iPhone 14",        storage: "128GB", status: "in-stock",  qty: 25, restockIn: null },
  { id: 20, series: "iPhone 14", model: "iPhone 14",        storage: "256GB", status: "in-stock",  qty: 13, restockIn: null },
  { id: 21, series: "iPhone 14", model: "iPhone 14 Plus",   storage: "128GB", status: "in-stock",  qty: 6,  restockIn: null },
  { id: 22, series: "iPhone 14", model: "iPhone 14 Plus",   storage: "256GB", status: "in-stock",  qty: 4,  restockIn: null },
  { id: 23, series: "iPhone 14", model: "iPhone 14 Pro",    storage: "128GB", status: "low-stock", qty: 3,  restockIn: null },
  { id: 24, series: "iPhone 14", model: "iPhone 14 Pro",    storage: "256GB", status: "in-stock",  qty: 8,  restockIn: null },
  { id: 25, series: "iPhone 14", model: "iPhone 14 Pro",    storage: "512GB", status: "sold-out",  qty: 0,  restockIn: "~2 weeks" },
  { id: 26, series: "iPhone 14", model: "iPhone 14 Pro Max",storage: "128GB", status: "in-stock",  qty: 6,  restockIn: null },
  { id: 27, series: "iPhone 14", model: "iPhone 14 Pro Max",storage: "256GB", status: "in-stock",  qty: 9,  restockIn: null },
  { id: 28, series: "iPhone 14", model: "iPhone 14 Pro Max",storage: "1TB",   status: "sold-out",  qty: 0,  restockIn: "~6 weeks" },
  // iPhone 13 Series
  { id: 29, series: "iPhone 13", model: "iPhone 13",        storage: "128GB", status: "in-stock",  qty: 30, restockIn: null },
  { id: 30, series: "iPhone 13", model: "iPhone 13",        storage: "256GB", status: "in-stock",  qty: 17, restockIn: null },
  { id: 31, series: "iPhone 13", model: "iPhone 13 Pro",    storage: "128GB", status: "in-stock",  qty: 10, restockIn: null },
  { id: 32, series: "iPhone 13", model: "iPhone 13 Pro",    storage: "256GB", status: "in-stock",  qty: 7,  restockIn: null },
  { id: 33, series: "iPhone 13", model: "iPhone 13 Pro Max",storage: "128GB", status: "in-stock",  qty: 8,  restockIn: null },
  { id: 34, series: "iPhone 13", model: "iPhone 13 Pro Max",storage: "256GB", status: "in-stock",  qty: 5,  restockIn: null },
  { id: 35, series: "iPhone 13", model: "iPhone 13 Pro Max",storage: "512GB", status: "low-stock", qty: 2,  restockIn: null },
  // iPhone 12 Series
  { id: 36, series: "iPhone 12", model: "iPhone 12",        storage: "64GB",  status: "in-stock",  qty: 20, restockIn: null },
  { id: 37, series: "iPhone 12", model: "iPhone 12",        storage: "128GB", status: "in-stock",  qty: 15, restockIn: null },
  { id: 38, series: "iPhone 12", model: "iPhone 12 Pro",    storage: "128GB", status: "in-stock",  qty: 9,  restockIn: null },
  { id: 39, series: "iPhone 12", model: "iPhone 12 Pro",    storage: "256GB", status: "low-stock", qty: 3,  restockIn: null },
  { id: 40, series: "iPhone 12", model: "iPhone 12 Pro Max",storage: "128GB", status: "in-stock",  qty: 11, restockIn: null },
  { id: 41, series: "iPhone 12", model: "iPhone 12 Pro Max",storage: "256GB", status: "in-stock",  qty: 6,  restockIn: null },
  { id: 42, series: "iPhone 12", model: "iPhone 12 Pro Max",storage: "512GB", status: "sold-out",  qty: 0,  restockIn: "~4 weeks" },
  // iPhone 11 Series
  { id: 43, series: "iPhone 11", model: "iPhone 11",        storage: "64GB",  status: "in-stock",  qty: 40, restockIn: null },
  { id: 44, series: "iPhone 11", model: "iPhone 11",        storage: "128GB", status: "in-stock",  qty: 28, restockIn: null },
  { id: 45, series: "iPhone 11", model: "iPhone 11 Pro",    storage: "64GB",  status: "in-stock",  qty: 12, restockIn: null },
  { id: 46, series: "iPhone 11", model: "iPhone 11 Pro",    storage: "256GB", status: "in-stock",  qty: 8,  restockIn: null },
  { id: 47, series: "iPhone 11", model: "iPhone 11 Pro Max",storage: "64GB",  status: "low-stock", qty: 3,  restockIn: null },
  { id: 48, series: "iPhone 11", model: "iPhone 11 Pro Max",storage: "256GB", status: "in-stock",  qty: 7,  restockIn: null },
  // iPhone XR
  { id: 49, series: "iPhone XR", model: "iPhone XR",        storage: "64GB",  status: "in-stock",  qty: 35, restockIn: null },
  { id: 50, series: "iPhone XR", model: "iPhone XR",        storage: "128GB", status: "in-stock",  qty: 22, restockIn: null },
];

export const ALL_SERIES   = ["All","iPhone 16","iPhone 15","iPhone 14","iPhone 13","iPhone 12","iPhone 11","iPhone XR"];
export const ALL_STATUSES = ["All","In Stock","Low Stock","Sold Out"];
export const SERIES_ORDER = ["iPhone 16","iPhone 15","iPhone 14","iPhone 13","iPhone 12","iPhone 11","iPhone XR"];

/** Filter chips: "All" first, then known series order, then any other series alphabetically. */
export function seriesChipsFromInventory(inventory, baseOrder = SERIES_ORDER) {
  const set = new Set((inventory || []).map((i) => i.series).filter(Boolean))
  const ordered = baseOrder.filter((s) => set.has(s))
  const rest = [...set].filter((s) => !baseOrder.includes(s)).sort()
  return ['All', ...ordered, ...rest]
}

export function getResellerPrice(reseller, model, storage, customPrices) {
  const prices = customPrices ?? BASE_PRICES;
  const base = prices[`${model}|${storage}`];
  if (!base) return null;
  return Math.ceil((base * reseller.markup) / 100) * 100;
}

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const STORAGE_KEY = 'frelzon_connect_data';

export function loadPersistedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function persistData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function formatPrice(price) {
  return "R" + price.toLocaleString("en-ZA");
}

export function statusLabel(s) {
  if (s === "in-stock")  return "In Stock";
  if (s === "low-stock") return "Low Stock";
  if (s === "sold-out")  return "Sold Out";
  return s;
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}
