import { Asset } from "../types/asset";

export const createSampleAssets = (): Asset[] => {
  const now = new Date().toISOString();

  // 실제 투자 정보나 현재 시세가 아니라, 최초 실행 UI 확인을 위한 임의 샘플값입니다.
  return [
    {
      id: createSampleId("woori-subscription"),
      type: "KRW_CASH",
      name: "우리은행 청약",
      institution: "우리은행",
      amountKrw: 10000000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("kb-cash"),
      type: "KRW_CASH",
      name: "국민은행",
      institution: "국민은행",
      amountKrw: 500000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("gold"),
      type: "METAL",
      name: "금",
      weightGram: 1000,
      averagePriceKrwPerGram: 3900,
      currentPriceKrwPerGram: 4000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("silver"),
      type: "METAL",
      name: "실버바",
      weightGram: 3000,
      averagePriceKrwPerGram: 1100,
      currentPriceKrwPerGram: 1200,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("samsung"),
      type: "KR_STOCK",
      name: "삼성전자",
      ticker: "005930",
      quantity: 5,
      averagePriceKrw: 68000,
      currentPriceKrw: 70000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("sk-hynix"),
      type: "KR_STOCK",
      name: "SK하이닉스",
      ticker: "000660",
      quantity: 1,
      averagePriceKrw: 170000,
      currentPriceKrw: 180000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("hyundai"),
      type: "KR_STOCK",
      name: "현대차",
      ticker: "005380",
      quantity: 1,
      averagePriceKrw: 230000,
      currentPriceKrw: 240000,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    },
    {
      id: createSampleId("tesla"),
      type: "US_STOCK",
      name: "테슬라",
      ticker: "TSLA",
      quantity: 3,
      averagePriceUsd: 240,
      currentPriceUsd: 260,
      memo: "샘플 데이터",
      createdAt: now,
      updatedAt: now
    }
  ];
};

const createSampleId = (suffix: string): string => `sample-${suffix}`;
