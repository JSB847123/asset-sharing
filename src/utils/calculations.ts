import { Asset, Currency, CurrencySummary, PortfolioSummary } from "../types/asset";

export const getAssetCurrency = (asset: Asset): Currency => (asset.type === "US_STOCK" ? "USD" : "KRW");

export const calculateAssetPurchaseAmount = (asset: Asset): number => {
  switch (asset.type) {
    case "KRW_CASH":
      return safeAmount(asset.amountKrw);
    case "METAL":
      return safeAmount(asset.weightGram) * safeAmount(asset.averagePriceKrwPerGram);
    case "KR_STOCK":
      return safeAmount(asset.quantity) * safeAmount(asset.averagePriceKrw);
    case "US_STOCK":
      return safeAmount(asset.quantity) * safeAmount(asset.averagePriceUsd);
  }
};

export const calculateAssetCurrentValue = (asset: Asset): number => {
  switch (asset.type) {
    case "KRW_CASH":
      return safeAmount(asset.amountKrw);
    case "METAL":
      return safeAmount(asset.weightGram) * safeAmount(asset.currentPriceKrwPerGram);
    case "KR_STOCK":
      return safeAmount(asset.quantity) * safeAmount(asset.currentPriceKrw);
    case "US_STOCK":
      return safeAmount(asset.quantity) * safeAmount(asset.currentPriceUsd);
  }
};

export const calculateAssetProfitLoss = (asset: Asset): number =>
  calculateAssetCurrentValue(asset) - calculateAssetPurchaseAmount(asset);

export const calculateAssetReturnRate = (asset: Asset): number | null => {
  const purchaseAmount = calculateAssetPurchaseAmount(asset);
  if (purchaseAmount <= 0) {
    return null;
  }

  return (calculateAssetProfitLoss(asset) / purchaseAmount) * 100;
};

export const calculatePortfolioSummary = (assets: Asset[], exchangeRate?: number): PortfolioSummary => {
  const krw = createEmptySummary("KRW");
  const usd = createEmptySummary("USD");

  assets.forEach((asset) => {
    const summary = getAssetCurrency(asset) === "USD" ? usd : krw;
    summary.purchaseAmount += calculateAssetPurchaseAmount(asset);
    summary.currentValue += calculateAssetCurrentValue(asset);
    summary.profitLoss += calculateAssetProfitLoss(asset);
  });

  krw.returnRate = calculateSummaryReturnRate(krw);
  usd.returnRate = calculateSummaryReturnRate(usd);

  const safeExchangeRate = exchangeRate !== undefined && Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : undefined;
  const usdValueInKrw = safeExchangeRate ? usd.currentValue * safeExchangeRate : undefined;

  return {
    krw,
    usd,
    exchangeRate: safeExchangeRate,
    usdValueInKrw,
    totalReferenceKrw: usdValueInKrw === undefined ? undefined : krw.currentValue + usdValueInKrw,
    assetCount: assets.length
  };
};

const createEmptySummary = (currency: Currency): CurrencySummary => ({
  currency,
  purchaseAmount: 0,
  currentValue: 0,
  profitLoss: 0,
  returnRate: null
});

const calculateSummaryReturnRate = (summary: CurrencySummary): number | null => {
  if (summary.purchaseAmount <= 0) {
    return null;
  }

  return (summary.profitLoss / summary.purchaseAmount) * 100;
};

const safeAmount = (value: number): number => (Number.isFinite(value) ? value : 0);
