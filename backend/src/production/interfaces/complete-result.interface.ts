export interface StockShortfall {
  itemId: number;
  itemName: string;
  required: number;
  available: number;
}

export interface CompleteResult {
  success: boolean;
  shortfall?: StockShortfall[];
  message?: string;
}
