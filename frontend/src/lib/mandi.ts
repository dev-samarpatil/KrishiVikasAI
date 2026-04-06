import { MandiPrice } from "@/types/mandi";

export const cropEmojis: Record<string, string> = {
  Tomato: "🍅",
  Onion: "🧅",
  Potato: "🥔",
  Wheat: "🌾",
  Rice: "🍚",
  Cotton: "🌿",
  Soybean: "🫘",
  Grapes: "🍇",
  Default: "🌱",
};

export const FALLBACK_PRICES: MandiPrice[] = [
  {
    "crop": "Tomato",
    "emoji": "🍅",
    "market": "Nashik APMC",
    "modal_price": 1800,
    "min_price": 1500,
    "max_price": 2200,
    "unit": "per quintal",
    "trend": "up",
    "trend_percent": "12%"
  },
  {
    "crop": "Onion",
    "emoji": "🧅",
    "market": "Lasalgaon Mandi",
    "modal_price": 2200,
    "min_price": 1800,
    "max_price": 2600,
    "unit": "per quintal",
    "trend": "flat",
    "trend_percent": "0%"
  },
  {
    "crop": "Cotton",
    "emoji": "🌿",
    "market": "Nagpur APMC",
    "modal_price": 6500,
    "min_price": 6000,
    "max_price": 7000,
    "unit": "per quintal",
    "trend": "up",
    "trend_percent": "5%"
  },
  {
    "crop": "Wheat",
    "emoji": "🌾",
    "market": "Pune Mandi",
    "modal_price": 2400,
    "min_price": 2200,
    "max_price": 2600,
    "unit": "per quintal",
    "trend": "down",
    "trend_percent": "3%"
  },
  {
    "crop": "Soybean",
    "emoji": "🫘",
    "market": "Latur APMC",
    "modal_price": 4200,
    "min_price": 3900,
    "max_price": 4500,
    "unit": "per quintal",
    "trend": "up",
    "trend_percent": "8%"
  },
  {
    "crop": "Grapes",
    "emoji": "🍇",
    "market": "Nashik APMC",
    "modal_price": 5500,
    "min_price": 4800,
    "max_price": 6200,
    "unit": "per quintal",
    "trend": "up",
    "trend_percent": "7%"
  }
];

export const getLocationBasedPrices = (district: string, state: string = "Maharashtra"): MandiPrice[] => {
  const d = district.toLowerCase();
  // Pune/Alandi area
  if (d.includes('pune') || 
      d.includes('haveli') ||
      d.includes('alandi')) {
    return [
      { crop: 'Tomato', emoji: '🍅', 
        market: 'Pune APMC', modal_price: 1650, min_price: 1500, max_price: 1800,
        trend: 'up', trend_percent: '8%' },
      { crop: 'Onion', emoji: '🧅',
        market: 'Pune APMC', modal_price: 2100, min_price: 1900, max_price: 2300,
        trend: 'flat', trend_percent: '0%' },
      { crop: 'Potato', emoji: '🥔',
        market: 'Pune APMC', modal_price: 1200, min_price: 1000, max_price: 1400,
        trend: 'down', trend_percent: '4%' },
      { crop: 'Wheat', emoji: '🌾',
        market: 'Pune Mandi', modal_price: 2400, min_price: 2200, max_price: 2600,
        trend: 'flat', trend_percent: '0%' },
      { crop: 'Grapes', emoji: '🍇',
        market: 'Pune APMC', modal_price: 6200, min_price: 5500, max_price: 6800,
        trend: 'up', trend_percent: '15%' },
    ];
  }
  // Nashik area
  if (d.includes('nashik')) {
    return FALLBACK_PRICES;
  }
  // Default Maharashtra prices
  return FALLBACK_PRICES;
};
