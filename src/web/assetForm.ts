import { Asset, AssetType } from "../types/asset";
import { parseNumberInput } from "../utils/formatters";

export interface AssetFormState {
  type: AssetType;
  name: string;
  memo: string;
  institution: string;
  amountKrw: string;
  weightGram: string;
  averagePriceKrwPerGram: string;
  currentPriceKrwPerGram: string;
  ticker: string;
  quantity: string;
  averagePriceKrw: string;
  currentPriceKrw: string;
  averagePriceUsd: string;
  currentPriceUsd: string;
}

export const emptyAssetForm: AssetFormState = {
  type: "KRW_CASH",
  name: "",
  memo: "",
  institution: "",
  amountKrw: "",
  weightGram: "",
  averagePriceKrwPerGram: "",
  currentPriceKrwPerGram: "",
  ticker: "",
  quantity: "",
  averagePriceKrw: "",
  currentPriceKrw: "",
  averagePriceUsd: "",
  currentPriceUsd: ""
};

export type BuildAssetResult = { ok: true; asset: Asset } | { ok: false; message: string };

export const buildAssetFromForm = (form: AssetFormState, existingAsset?: Asset): BuildAssetResult => {
  const name = form.name.trim();
  if (!name) {
    return { ok: false, message: "자산명을 입력해주세요." };
  }

  const base = {
    id: existingAsset?.id ?? createId(),
    type: form.type,
    name,
    memo: optionalText(form.memo),
    createdAt: existingAsset?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  switch (form.type) {
    case "KRW_CASH": {
      const amountKrw = parseRequiredPositiveNumber(form.amountKrw, "금액");
      if (!amountKrw.ok) {
        return amountKrw;
      }

      return {
        ok: true,
        asset: {
          ...base,
          type: "KRW_CASH",
          institution: optionalText(form.institution),
          amountKrw: amountKrw.value
        }
      };
    }
    case "METAL": {
      const weightGram = parseRequiredPositiveNumber(form.weightGram, "보유 중량");
      if (!weightGram.ok) {
        return weightGram;
      }

      const averagePrice = parseRequiredNonNegativeNumber(form.averagePriceKrwPerGram, "매수 평균단가");
      if (!averagePrice.ok) {
        return averagePrice;
      }

      const currentPrice = parseRequiredNonNegativeNumber(form.currentPriceKrwPerGram, "현재 단가");
      if (!currentPrice.ok) {
        return currentPrice;
      }

      return {
        ok: true,
        asset: {
          ...base,
          type: "METAL",
          weightGram: weightGram.value,
          averagePriceKrwPerGram: averagePrice.value,
          currentPriceKrwPerGram: currentPrice.value
        }
      };
    }
    case "KR_STOCK": {
      const quantity = parseRequiredPositiveNumber(form.quantity, "보유 수량");
      if (!quantity.ok) {
        return quantity;
      }

      const averagePrice = parseRequiredNonNegativeNumber(form.averagePriceKrw, "매수 평균단가");
      if (!averagePrice.ok) {
        return averagePrice;
      }

      const currentPrice = parseRequiredNonNegativeNumber(form.currentPriceKrw, "현재가");
      if (!currentPrice.ok) {
        return currentPrice;
      }

      return {
        ok: true,
        asset: {
          ...base,
          type: "KR_STOCK",
          ticker: optionalText(form.ticker),
          quantity: quantity.value,
          averagePriceKrw: averagePrice.value,
          currentPriceKrw: currentPrice.value
        }
      };
    }
    case "US_STOCK": {
      const quantity = parseRequiredPositiveNumber(form.quantity, "보유 수량");
      if (!quantity.ok) {
        return quantity;
      }

      const averagePrice = parseRequiredNonNegativeNumber(form.averagePriceUsd, "매수 평균단가");
      if (!averagePrice.ok) {
        return averagePrice;
      }

      const currentPrice = parseRequiredNonNegativeNumber(form.currentPriceUsd, "현재가");
      if (!currentPrice.ok) {
        return currentPrice;
      }

      return {
        ok: true,
        asset: {
          ...base,
          type: "US_STOCK",
          ticker: optionalText(form.ticker),
          quantity: quantity.value,
          averagePriceUsd: averagePrice.value,
          currentPriceUsd: currentPrice.value
        }
      };
    }
  }
};

export const createFormFromAsset = (asset: Asset): AssetFormState => {
  const base = {
    ...emptyAssetForm,
    type: asset.type,
    name: asset.name,
    memo: asset.memo ?? ""
  };

  switch (asset.type) {
    case "KRW_CASH":
      return {
        ...base,
        institution: asset.institution ?? "",
        amountKrw: String(asset.amountKrw)
      };
    case "METAL":
      return {
        ...base,
        weightGram: String(asset.weightGram),
        averagePriceKrwPerGram: String(asset.averagePriceKrwPerGram),
        currentPriceKrwPerGram: String(asset.currentPriceKrwPerGram)
      };
    case "KR_STOCK":
      return {
        ...base,
        ticker: asset.ticker ?? "",
        quantity: String(asset.quantity),
        averagePriceKrw: String(asset.averagePriceKrw),
        currentPriceKrw: String(asset.currentPriceKrw)
      };
    case "US_STOCK":
      return {
        ...base,
        ticker: asset.ticker ?? "",
        quantity: String(asset.quantity),
        averagePriceUsd: String(asset.averagePriceUsd),
        currentPriceUsd: String(asset.currentPriceUsd)
      };
  }
};

type ParsedNumberResult = { ok: true; value: number } | { ok: false; message: string };

const parseRequiredPositiveNumber = (value: string, label: string): ParsedNumberResult => {
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) {
    return { ok: false, message: `${label}은 숫자로 입력해주세요.` };
  }
  if (parsed <= 0) {
    return { ok: false, message: `${label}은 0보다 커야 합니다.` };
  }
  return { ok: true, value: parsed };
};

const parseRequiredNonNegativeNumber = (value: string, label: string): ParsedNumberResult => {
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) {
    return { ok: false, message: `${label}은 숫자로 입력해주세요.` };
  }
  if (parsed < 0) {
    return { ok: false, message: `${label}은 0 이상이어야 합니다.` };
  }
  return { ok: true, value: parsed };
};

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
