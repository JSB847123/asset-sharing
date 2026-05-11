import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAssetCurrentValue,
  calculateAssetReturnRate,
  calculatePortfolioSummary
} from "../src/utils/calculations";
import { formatPercent } from "../src/utils/formatters";
import { generateShareMessage } from "../src/utils/shareMessage";
import { Asset, KrStockAsset, KrwCashAsset, MetalAsset, UsStockAsset } from "../src/types/asset";

const now = "2026-05-12T00:00:00.000Z";

const cashAsset = (amountKrw = 1234567): KrwCashAsset => ({
  id: "cash-1",
  type: "KRW_CASH",
  name: "우리은행 청약",
  institution: "우리은행",
  amountKrw,
  createdAt: now,
  updatedAt: now
});

const metalAsset = (): MetalAsset => ({
  id: "metal-1",
  type: "METAL",
  name: "금",
  weightGram: 1000,
  averagePriceKrwPerGram: 3900,
  currentPriceKrwPerGram: 4000,
  createdAt: now,
  updatedAt: now
});

const krStockAsset = (): KrStockAsset => ({
  id: "kr-stock-1",
  type: "KR_STOCK",
  name: "삼성전자",
  ticker: "005930",
  quantity: 5,
  averagePriceKrw: 68000,
  currentPriceKrw: 70000,
  createdAt: now,
  updatedAt: now
});

const usStockAsset = (): UsStockAsset => ({
  id: "us-stock-1",
  type: "US_STOCK",
  name: "테슬라",
  ticker: "TSLA",
  quantity: 3,
  averagePriceUsd: 240,
  currentPriceUsd: 260,
  createdAt: now,
  updatedAt: now
});

test("원화 현금성 자산은 입력 금액 그대로 평가금액이 된다", () => {
  assert.equal(calculateAssetCurrentValue(cashAsset()), 1234567);
});

test("귀금속 평가금액은 보유 중량 g 곱하기 현재가 KRW/g로 계산한다", () => {
  assert.equal(calculateAssetCurrentValue(metalAsset()), 4000000);
});

test("국내주식 평가금액은 보유 수량 곱하기 현재가 KRW로 계산한다", () => {
  assert.equal(calculateAssetCurrentValue(krStockAsset()), 350000);
});

test("해외주식 평가금액은 보유 수량 곱하기 현재가 USD로 계산한다", () => {
  assert.equal(calculateAssetCurrentValue(usStockAsset()), 780);
});

test("포트폴리오 요약은 원화 자산과 달러 자산을 분리해서 합산한다", () => {
  const assets: Asset[] = [cashAsset(10000000), metalAsset(), krStockAsset(), usStockAsset()];
  const summary = calculatePortfolioSummary(assets);

  assert.equal(summary.krw.currentValue, 14350000);
  assert.equal(summary.krw.purchaseAmount, 14240000);
  assert.equal(summary.krw.profitLoss, 110000);
  assert.equal(summary.usd.currentValue, 780);
  assert.equal(summary.usd.purchaseAmount, 720);
  assert.equal(summary.usd.profitLoss, 60);
});

test("평균단가가 0이면 수익률은 NaN 또는 Infinity가 아니라 null로 계산하고 '-'로 표시한다", () => {
  const zeroAverageAsset: KrStockAsset = {
    ...krStockAsset(),
    averagePriceKrw: 0
  };

  const returnRate = calculateAssetReturnRate(zeroAverageAsset);

  assert.equal(returnRate, null);
  assert.equal(formatPercent(returnRate), "-");
});

test("공유 메시지는 원화와 달러를 요구 포맷으로 표시한다", () => {
  const assets: Asset[] = [cashAsset(10000000), usStockAsset()];
  const summary = calculatePortfolioSummary(assets);
  const message = generateShareMessage(assets, summary);

  assert.match(message, /\[우리 자산 노트\]/);
  assert.match(message, /총 평가금액: 10,000,000원/);
  assert.match(message, /매수원금: 10,000,000원/);
  assert.match(message, /평가손익: 0원/);
  assert.match(message, /총 평가금액: \$780\.00/);
  assert.match(message, /매수원금: \$720\.00/);
  assert.match(message, /평가손익: \+\$60\.00/);
  assert.match(message, /테슬라: 3주 \/ 평가금액 \$780\.00/);
});

test("공유 메시지는 사용자가 바꾼 앱 이름을 제목으로 사용한다", () => {
  const assets: Asset[] = [cashAsset(10000000)];
  const summary = calculatePortfolioSummary(assets);
  const message = generateShareMessage(assets, summary, "가족 자산 노트");

  assert.match(message, /^\[가족 자산 노트\]/);
});
