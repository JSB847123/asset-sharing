import { useCallback, useMemo, useState } from "react";

import { Asset } from "../types/asset";
import { loadWebAssets, saveWebAssets } from "./storage";

export interface WebAssetsState {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (assetId: string) => void;
  getAssetById: (assetId: string) => Asset | undefined;
}

export const useWebAssets = (): WebAssetsState => {
  const [assets, setAssets] = useState<Asset[]>(() => loadWebAssets());

  const replaceAssets = useCallback((nextAssets: Asset[]) => {
    setAssets(nextAssets);
    saveWebAssets(nextAssets);
  }, []);

  const addAsset = useCallback(
    (asset: Asset) => {
      replaceAssets([asset, ...assets]);
    },
    [assets, replaceAssets]
  );

  const updateAsset = useCallback(
    (asset: Asset) => {
      replaceAssets(assets.map((item) => (item.id === asset.id ? asset : item)));
    },
    [assets, replaceAssets]
  );

  const deleteAsset = useCallback(
    (assetId: string) => {
      replaceAssets(assets.filter((asset) => asset.id !== assetId));
    },
    [assets, replaceAssets]
  );

  const getAssetById = useCallback((assetId: string) => assets.find((asset) => asset.id === assetId), [assets]);

  return useMemo(
    () => ({
      assets,
      addAsset,
      updateAsset,
      deleteAsset,
      getAssetById
    }),
    [addAsset, assets, deleteAsset, getAssetById, updateAsset]
  );
};
