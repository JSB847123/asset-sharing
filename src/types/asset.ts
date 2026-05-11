export type AssetType = "KRW_CASH" | "METAL" | "KR_STOCK" | "US_STOCK";

export type Currency = "KRW" | "USD";

export interface BaseAsset {
  id: string;
  type: AssetType;
  name: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KrwCashAsset extends BaseAsset {
  type: "KRW_CASH";
  institution?: string;
  amountKrw: number;
}

export interface MetalAsset extends BaseAsset {
  type: "METAL";
  weightGram: number;
  averagePriceKrwPerGram: number;
  currentPriceKrwPerGram: number;
}

export interface KrStockAsset extends BaseAsset {
  type: "KR_STOCK";
  ticker?: string;
  quantity: number;
  averagePriceKrw: number;
  currentPriceKrw: number;
}

export interface UsStockAsset extends BaseAsset {
  type: "US_STOCK";
  ticker?: string;
  quantity: number;
  averagePriceUsd: number;
  currentPriceUsd: number;
}

export type Asset = KrwCashAsset | MetalAsset | KrStockAsset | UsStockAsset;

export interface CurrencySummary {
  currency: Currency;
  purchaseAmount: number;
  currentValue: number;
  profitLoss: number;
  returnRate: number | null;
}

export interface PortfolioSummary {
  krw: CurrencySummary;
  usd: CurrencySummary;
  exchangeRate?: number;
  usdValueInKrw?: number;
  totalReferenceKrw?: number;
  assetCount: number;
}
