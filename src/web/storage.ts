import { createSampleAssets } from "../data/sampleAssets";
import { Asset } from "../types/asset";

const ASSETS_STORAGE_KEY = "woori-asset-note-web/assets";
const SAMPLE_INITIALIZED_KEY = "woori-asset-note-web/sample-initialized";

export const loadWebAssets = (): Asset[] => {
  const storedAssets = safeGetItem(ASSETS_STORAGE_KEY);
  if (storedAssets !== null) {
    return parseStoredAssets(storedAssets);
  }

  if (safeGetItem(SAMPLE_INITIALIZED_KEY) === "true") {
    return [];
  }

  const sampleAssets = createSampleAssets();
  saveWebAssets(sampleAssets);
  safeSetItem(SAMPLE_INITIALIZED_KEY, "true");
  return sampleAssets;
};

export const saveWebAssets = (assets: Asset[]): void => {
  safeSetItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
};

const parseStoredAssets = (value: string): Asset[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(isAssetLike) as Asset[];
    }
  } catch {
    return [];
  }

  return [];
};

const isAssetLike = (value: unknown): value is Asset => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.type === "string" && typeof record.name === "string";
};

const safeGetItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    window.alert("브라우저 저장소에 데이터를 저장하지 못했습니다.");
  }
};
