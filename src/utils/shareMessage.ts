import { Asset, PortfolioSummary } from "../types/asset";
import { calculateAssetCurrentValue, getAssetCurrency } from "./calculations";
import { formatGram, formatKrw, formatPercent, formatQuantity, formatSignedKrw, formatSignedUsd, formatUsd } from "./formatters";

export const generateShareMessage = (assets: Asset[], summary: PortfolioSummary, appTitle = "우리 자산 노트"): string => {
  const sections: string[] = [`[${appTitle}]`];

  if (summary.krw.currentValue > 0 || summary.krw.purchaseAmount > 0) {
    sections.push(
      [
        "📌 원화 자산",
        `총 평가금액: ${formatKrw(summary.krw.currentValue)}`,
        `매수원금: ${formatKrw(summary.krw.purchaseAmount)}`,
        `평가손익: ${formatSignedKrw(summary.krw.profitLoss)}`,
        `수익률: ${formatPercent(summary.krw.returnRate)}`
      ].join("\n")
    );
  }

  if (summary.usd.currentValue > 0 || summary.usd.purchaseAmount > 0) {
    sections.push(
      [
        "📌 달러 자산",
        `총 평가금액: ${formatUsd(summary.usd.currentValue)}`,
        `매수원금: ${formatUsd(summary.usd.purchaseAmount)}`,
        `평가손익: ${formatSignedUsd(summary.usd.profitLoss)}`,
        `수익률: ${formatPercent(summary.usd.returnRate)}`
      ].join("\n")
    );
  }

  if (assets.length > 0) {
    sections.push(["📌 주요 보유 자산", ...assets.map(formatAssetSummaryLine)].join("\n"));
  }

  sections.push(`공유일: ${formatDate(new Date())}`);

  return sections.join("\n\n");
};

const formatAssetSummaryLine = (asset: Asset): string => {
  const currentValue = calculateAssetCurrentValue(asset);
  const formattedValue = getAssetCurrency(asset) === "USD" ? formatUsd(currentValue) : formatKrw(currentValue);

  switch (asset.type) {
    case "KRW_CASH":
      return `- ${asset.name}: ${formatKrw(asset.amountKrw)}`;
    case "METAL":
      return `- ${asset.name}: ${formatGram(asset.weightGram)} / 평가금액 ${formattedValue}`;
    case "KR_STOCK":
    case "US_STOCK":
      return `- ${asset.name}: ${formatQuantity(asset.quantity)} / 평가금액 ${formattedValue}`;
  }
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};
