import { Asset, AssetType } from "../types/asset";
import {
  calculateAssetCurrentValue,
  calculateAssetProfitLoss,
  calculateAssetPurchaseAmount,
  calculateAssetReturnRate,
  getAssetCurrency
} from "./calculations";
import {
  formatGram,
  formatKrw,
  formatPercent,
  formatQuantity,
  formatSignedKrw,
  formatSignedUsd,
  formatUsd
} from "./formatters";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  KRW_CASH: "원화 현금성 자산",
  METAL: "귀금속",
  KR_STOCK: "국내주식",
  US_STOCK: "해외주식"
};

export const getAssetPrimaryInfo = (asset: Asset): string => {
  switch (asset.type) {
    case "KRW_CASH":
      return asset.institution ? `${asset.institution} · ${formatKrw(asset.amountKrw)}` : formatKrw(asset.amountKrw);
    case "METAL":
      return `보유 중량 ${formatGram(asset.weightGram)}`;
    case "KR_STOCK":
      return `${asset.ticker ? `${asset.ticker} · ` : ""}${formatQuantity(asset.quantity)}`;
    case "US_STOCK":
      return `${asset.ticker ? `${asset.ticker} · ` : ""}${formatQuantity(asset.quantity)}`;
  }
};

export const getAssetUnitPriceInfo = (asset: Asset): string => {
  switch (asset.type) {
    case "KRW_CASH":
      return "평균단가 - / 현재가 -";
    case "METAL":
      return `평균단가 ${formatKrw(asset.averagePriceKrwPerGram)}/g · 현재가 ${formatKrw(asset.currentPriceKrwPerGram)}/g`;
    case "KR_STOCK":
      return `평균단가 ${formatKrw(asset.averagePriceKrw)} · 현재가 ${formatKrw(asset.currentPriceKrw)}`;
    case "US_STOCK":
      return `평균단가 ${formatUsd(asset.averagePriceUsd)} · 현재가 ${formatUsd(asset.currentPriceUsd)}`;
  }
};

export const getAssetFormattedCurrentValue = (asset: Asset): string => {
  const currentValue = calculateAssetCurrentValue(asset);
  return getAssetCurrency(asset) === "USD" ? formatUsd(currentValue) : formatKrw(currentValue);
};

export const getAssetFormattedPurchaseAmount = (asset: Asset): string => {
  const purchaseAmount = calculateAssetPurchaseAmount(asset);
  return getAssetCurrency(asset) === "USD" ? formatUsd(purchaseAmount) : formatKrw(purchaseAmount);
};

export const getAssetFormattedProfitLoss = (asset: Asset): string => {
  const profitLoss = calculateAssetProfitLoss(asset);
  return getAssetCurrency(asset) === "USD" ? formatSignedUsd(profitLoss) : formatSignedKrw(profitLoss);
};

export const getAssetFormattedReturnRate = (asset: Asset): string => formatPercent(calculateAssetReturnRate(asset));

export const getProfitColor = (value: number): string => {
  if (value > 0) {
    return "#2563eb";
  }
  if (value < 0) {
    return "#dc2626";
  }
  return "#475569";
};
