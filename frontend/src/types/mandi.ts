export interface MandiPrice {
  crop: string;
  market: string;
  min_price: number | string;
  max_price: number | string;
  modal_price: number | string;
  trend: "up" | "down" | "flat";
  unit?: string;
  trend_percent?: string;
  emoji?: string;
}
