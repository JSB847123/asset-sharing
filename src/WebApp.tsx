import { FormEvent, useEffect, useMemo, useState } from "react";

import { Asset, AssetType } from "./types/asset";
import {
  ASSET_TYPE_LABELS,
  getAssetFormattedCurrentValue,
  getAssetFormattedProfitLoss,
  getAssetFormattedPurchaseAmount,
  getAssetFormattedReturnRate,
  getAssetPrimaryInfo,
  getAssetUnitPriceInfo,
  getProfitColor
} from "./utils/assetLabels";
import { calculateAssetCurrentValue, calculateAssetProfitLoss, calculatePortfolioSummary } from "./utils/calculations";
import { formatKrw, formatPercent, formatSignedKrw, formatSignedUsd, formatUsd, parseNumberInput, sanitizeNumberInput } from "./utils/formatters";
import { generateShareMessage } from "./utils/shareMessage";
import { AssetFormState, buildAssetFromForm, createFormFromAsset, emptyAssetForm } from "./web/assetForm";
import { useWebAssets } from "./web/useWebAssets";

type ViewMode = "DASHBOARD" | "LIST" | "FORM" | "DETAIL";
type FilterType = AssetType | "ALL";
type SortType = "RECENT" | "VALUE";

const assetTypes: AssetType[] = ["KRW_CASH", "METAL", "KR_STOCK", "US_STOCK"];
const filters: FilterType[] = ["ALL", ...assetTypes];
const TITLE_PREFIX_STORAGE_KEY = "woori-asset-note-web/title-prefix";
const CHANGE_UNLOCKED_SESSION_KEY = "woori-asset-note-web/change-unlocked";
const CHANGE_PASSWORD = "9207";

export function WebApp() {
  const { assets, addAsset, updateAsset, deleteAsset, getAssetById } = useWebAssets();
  const [view, setView] = useState<ViewMode>("DASHBOARD");
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [editingAssetId, setEditingAssetId] = useState<string | undefined>();
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [titlePrefix, setTitlePrefix] = useState(() => loadTitlePrefix());
  const [isChangeUnlocked, setIsChangeUnlocked] = useState(() => loadChangeUnlocked());
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const exchangeRate = parseNumberInput(exchangeRateInput);
  const summary = useMemo(
    () => calculatePortfolioSummary(assets, Number.isFinite(exchangeRate) ? exchangeRate : undefined),
    [assets, exchangeRate]
  );
  const appTitle = useMemo(() => createAppTitle(titlePrefix), [titlePrefix]);

  const selectedAsset = selectedAssetId ? getAssetById(selectedAssetId) : undefined;
  const editingAsset = editingAssetId ? getAssetById(editingAssetId) : undefined;

  useEffect(() => {
    saveTitlePrefix(titlePrefix);
    document.title = appTitle;
  }, [appTitle, titlePrefix]);

  const openDashboard = () => {
    setView("DASHBOARD");
    setSelectedAssetId(undefined);
    setEditingAssetId(undefined);
  };

  const openList = () => {
    setView("LIST");
    setSelectedAssetId(undefined);
    setEditingAssetId(undefined);
  };

  const openCreate = () => {
    if (!ensureChangeUnlocked()) {
      return;
    }

    setView("FORM");
    setEditingAssetId(undefined);
  };

  const openEdit = (assetId: string) => {
    if (!ensureChangeUnlocked()) {
      return;
    }

    setView("FORM");
    setEditingAssetId(assetId);
  };

  const openDetail = (assetId: string) => {
    setView("DETAIL");
    setSelectedAssetId(assetId);
  };

  const handleDelete = (asset: Asset) => {
    if (!ensureChangeUnlocked()) {
      return;
    }

    if (window.confirm(`${asset.name} 자산을 삭제할까요?`)) {
      deleteAsset(asset.id);
      if (selectedAssetId === asset.id) {
        openList();
      }
    }
  };

  const handleSaveAsset = (asset: Asset) => {
    if (!ensureChangeUnlocked()) {
      return;
    }

    if (editingAssetId) {
      updateAsset(asset);
      openDetail(asset.id);
      return;
    }

    addAsset(asset);
    openDetail(asset.id);
  };

  const handleShare = async () => {
    const message = generateShareMessage(assets, summary, appTitle);

    try {
      if (navigator.share) {
        await navigator.share({
          title: appTitle,
          text: message
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        window.alert("공유 메시지를 클립보드에 복사했습니다. 카카오톡 대화창에 붙여넣어 공유할 수 있습니다.");
        return;
      }

      window.prompt("공유 메시지를 복사하세요.", message);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      window.alert("공유에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordInput === CHANGE_PASSWORD) {
      setIsChangeUnlocked(true);
      saveChangeUnlocked(true);
      setPasswordInput("");
      setPasswordError("");
      return;
    }

    setPasswordError("비밀번호가 맞지 않습니다.");
  };

  const handleLock = () => {
    setIsChangeUnlocked(false);
    saveChangeUnlocked(false);
    setPasswordInput("");
    setPasswordError("");
    if (view === "FORM") {
      openDashboard();
    }
  };

  const handleTitlePrefixChange = (value: string) => {
    if (!ensureChangeUnlocked()) {
      return;
    }

    setTitlePrefix(value);
  };

  const ensureChangeUnlocked = (): boolean => {
    if (isChangeUnlocked) {
      return true;
    }

    setPasswordError("변경하려면 비밀번호를 입력해주세요.");
    window.alert("변경하려면 비밀번호 4자리를 입력해 잠금을 해제해주세요.");
    return false;
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">개인 금융 노트</p>
          <h1 className="editable-title">
            <input
              aria-label="앱 이름 앞부분"
              disabled={!isChangeUnlocked}
              value={titlePrefix}
              onChange={(event) => handleTitlePrefixChange(event.target.value)}
              placeholder="우리"
              type="text"
            />
            <span>자산 노트</span>
          </h1>
        </div>
        <nav className="nav">
          <button className={view === "DASHBOARD" ? "nav-button active" : "nav-button"} type="button" onClick={openDashboard}>
            대시보드
          </button>
          <button className={view === "LIST" ? "nav-button active" : "nav-button"} type="button" onClick={openList}>
            자산 목록
          </button>
          <button className={view === "FORM" && !editingAssetId ? "nav-button active" : "nav-button"} type="button" onClick={openCreate}>
            자산 추가
          </button>
        </nav>
        <section className={isChangeUnlocked ? "change-lock unlocked" : "change-lock"}>
          <div>
            <strong>{isChangeUnlocked ? "변경 가능" : "변경 잠금"}</strong>
            <span>{isChangeUnlocked ? "이 브라우저 세션에서 수정할 수 있습니다." : "비밀번호를 입력해야 수정할 수 있습니다."}</span>
          </div>
          {isChangeUnlocked ? (
            <button className="lock-button" type="button" onClick={handleLock}>
              다시 잠그기
            </button>
          ) : (
            <form className="password-form" onSubmit={handleUnlock}>
              <input
                aria-label="변경 비밀번호"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPasswordInput(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="비밀번호"
                type="password"
                value={passwordInput}
              />
              <button type="submit">해제</button>
              {passwordError ? <p>{passwordError}</p> : null}
            </form>
          )}
        </section>
        <div className="sidebar-note">
          <strong>수동 입력 기준</strong>
          <span>자동 시세 연동 없이 입력한 현재가로 계산합니다.</span>
        </div>
      </aside>

      <main className="main-panel">
        {view === "DASHBOARD" ? (
          <DashboardView
            assets={assets}
            exchangeRateInput={exchangeRateInput}
            onExchangeRateChange={setExchangeRateInput}
            onCreate={openCreate}
            onDetail={openDetail}
            onEdit={openEdit}
            onList={openList}
            onShare={handleShare}
            summary={summary}
            canModify={isChangeUnlocked}
          />
        ) : null}

        {view === "LIST" ? (
          <AssetListView assets={assets} canModify={isChangeUnlocked} onCreate={openCreate} onDelete={handleDelete} onDetail={openDetail} onEdit={openEdit} />
        ) : null}

        {view === "FORM" ? (
          <AssetFormView
            key={editingAsset?.id ?? "new-asset"}
            existingAsset={editingAsset}
            canModify={isChangeUnlocked}
            onCancel={editingAsset ? () => openDetail(editingAsset.id) : openDashboard}
            onSave={handleSaveAsset}
          />
        ) : null}

        {view === "DETAIL" ? (
          <AssetDetailView asset={selectedAsset} canModify={isChangeUnlocked} onBack={openList} onDelete={handleDelete} onEdit={openEdit} />
        ) : null}
      </main>
    </div>
  );
}

interface DashboardViewProps {
  assets: Asset[];
  exchangeRateInput: string;
  onExchangeRateChange: (value: string) => void;
  onCreate: () => void;
  onDetail: (assetId: string) => void;
  onEdit: (assetId: string) => void;
  onList: () => void;
  onShare: () => void;
  summary: ReturnType<typeof calculatePortfolioSummary>;
  canModify: boolean;
}

function DashboardView({
  assets,
  exchangeRateInput,
  onExchangeRateChange,
  onCreate,
  onDetail,
  onEdit,
  onList,
  onShare,
  summary,
  canModify
}: DashboardViewProps) {
  const previewAssets = assets.slice(0, 5);

  return (
    <section className="screen-stack">
      <header className="screen-header">
        <div>
          <p className="eyebrow">전체 자산 요약</p>
          <h2>원화와 달러를 따로 보는 자산 현황</h2>
        </div>
        <div className="header-actions">
          <button className="button secondary" type="button" onClick={onShare}>
            카카오톡으로 공유
          </button>
          <button className="button primary" disabled={!canModify} type="button" onClick={onCreate}>
            자산 추가
          </button>
        </div>
      </header>

      <div className="summary-layout">
        <SummaryTile
          label="총 원화 자산"
          value={formatKrw(summary.krw.currentValue)}
          details={[
            ["매수원금", formatKrw(summary.krw.purchaseAmount)],
            ["평가손익", formatSignedKrw(summary.krw.profitLoss)],
            ["수익률", formatPercent(summary.krw.returnRate)]
          ]}
          tone="blue"
        />
        <SummaryTile
          label="총 달러 자산"
          value={formatUsd(summary.usd.currentValue)}
          details={[
            ["매수원금", formatUsd(summary.usd.purchaseAmount)],
            ["평가손익", formatSignedUsd(summary.usd.profitLoss)],
            ["수익률", formatPercent(summary.usd.returnRate)]
          ]}
          tone="green"
        />
      </div>

      <section className="card exchange-card">
        <div className="card-heading">
          <div>
            <h3>환율 참고 계산</h3>
            <p>기본 총액은 KRW와 USD를 분리해서 표시합니다.</p>
          </div>
        </div>
        <div className="exchange-grid">
          <NumberField
            label="환율"
            value={exchangeRateInput}
            onChange={onExchangeRateChange}
            placeholder="예: 1350"
            suffix="원/USD"
          />
          <div className="exchange-result">
            <span>달러 자산 원화 환산</span>
            <strong>{summary.usdValueInKrw === undefined ? "-" : formatKrw(summary.usdValueInKrw)}</strong>
          </div>
          <div className="exchange-result">
            <span>참고 총액</span>
            <strong>{summary.totalReferenceKrw === undefined ? "-" : formatKrw(summary.totalReferenceKrw)}</strong>
          </div>
        </div>
      </section>

      <section className="screen-stack compact">
        <div className="section-title-row">
          <div>
            <h3>최근 자산</h3>
            <p>총 {assets.length}개 자산</p>
          </div>
          <button className="text-button" type="button" onClick={onList}>
            전체 보기
          </button>
        </div>

        {previewAssets.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <div className="asset-grid">
            {previewAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} canModify={canModify} onDetail={onDetail} onEdit={onEdit} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

interface AssetListViewProps {
  assets: Asset[];
  canModify: boolean;
  onCreate: () => void;
  onDelete: (asset: Asset) => void;
  onDetail: (assetId: string) => void;
  onEdit: (assetId: string) => void;
}

function AssetListView({ assets, canModify, onCreate, onDelete, onDetail, onEdit }: AssetListViewProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("RECENT");

  const visibleAssets = useMemo(() => {
    const filteredAssets = filter === "ALL" ? assets : assets.filter((asset) => asset.type === filter);
    return [...filteredAssets].sort((a, b) => compareAssets(a, b, sort));
  }, [assets, filter, sort]);

  return (
    <section className="screen-stack">
      <header className="screen-header">
        <div>
          <p className="eyebrow">자산 목록</p>
          <h2>등록된 자산 {visibleAssets.length}개</h2>
        </div>
        <button className="button primary" disabled={!canModify} type="button" onClick={onCreate}>
          자산 추가
        </button>
      </header>

      <div className="toolbar">
        <div className="chip-group" aria-label="유형별 필터">
          {filters.map((item) => (
            <button key={item} className={filter === item ? "chip active" : "chip"} type="button" onClick={() => setFilter(item)}>
              {item === "ALL" ? "전체" : ASSET_TYPE_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="segmented" aria-label="정렬">
          <button className={sort === "RECENT" ? "active" : ""} type="button" onClick={() => setSort("RECENT")}>
            최근 등록순
          </button>
          <button className={sort === "VALUE" ? "active" : ""} type="button" onClick={() => setSort("VALUE")}>
            평가금액순
          </button>
        </div>
      </div>

      {visibleAssets.length === 0 ? (
        <EmptyState onCreate={onCreate} />
      ) : (
        <div className="asset-grid">
          {visibleAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} canModify={canModify} onDelete={onDelete} onDetail={onDetail} onEdit={onEdit} />
          ))}
        </div>
      )}
    </section>
  );
}

interface AssetFormViewProps {
  existingAsset?: Asset;
  canModify: boolean;
  onCancel: () => void;
  onSave: (asset: Asset) => void;
}

function AssetFormView({ existingAsset, canModify, onCancel, onSave }: AssetFormViewProps) {
  const [form, setForm] = useState<AssetFormState>(() => (existingAsset ? createFormFromAsset(existingAsset) : emptyAssetForm));

  const updateField = (field: keyof AssetFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectType = (type: AssetType) => {
    setForm((current) => ({
      ...emptyAssetForm,
      type,
      name: current.name,
      memo: current.memo
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = buildAssetFromForm(form, existingAsset);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }
    onSave(result.asset);
  };

  return (
    <section className="screen-stack narrow">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{existingAsset ? "자산 수정" : "자산 등록"}</p>
          <h2>{existingAsset ? existingAsset.name : "새 자산 추가"}</h2>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <fieldset>
          <legend>자산 유형</legend>
          <div className="type-grid">
            {assetTypes.map((type) => (
              <button key={type} className={form.type === type ? "type-button active" : "type-button"} type="button" onClick={() => selectType(type)}>
                {ASSET_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field-grid">
          <TextField
            label={form.type === "KR_STOCK" || form.type === "US_STOCK" ? "종목명" : "자산명"}
            value={form.name}
            onChange={(value) => updateField("name", value)}
            placeholder="예: 우리은행 청약"
          />

          {form.type === "KRW_CASH" ? (
            <>
              <TextField label="금융기관명" value={form.institution} onChange={(value) => updateField("institution", value)} placeholder="예: 우리은행" />
              <NumberField label="금액 KRW" value={form.amountKrw} onChange={(value) => updateField("amountKrw", value)} placeholder="10000000" suffix="원" />
            </>
          ) : null}

          {form.type === "METAL" ? (
            <>
              <NumberField label="보유 중량" value={form.weightGram} onChange={(value) => updateField("weightGram", value)} placeholder="1000" suffix="g" />
              <NumberField
                label="매수 평균단가 KRW/g"
                value={form.averagePriceKrwPerGram}
                onChange={(value) => updateField("averagePriceKrwPerGram", value)}
                placeholder="3900"
                suffix="원"
              />
              <NumberField
                label="현재 단가 KRW/g"
                value={form.currentPriceKrwPerGram}
                onChange={(value) => updateField("currentPriceKrwPerGram", value)}
                placeholder="4000"
                suffix="원"
              />
            </>
          ) : null}

          {form.type === "KR_STOCK" ? (
            <>
              <TextField label="종목코드" value={form.ticker} onChange={(value) => updateField("ticker", value)} placeholder="예: 005930" />
              <NumberField label="보유 수량" value={form.quantity} onChange={(value) => updateField("quantity", value)} placeholder="5" suffix="주" />
              <NumberField label="매수 평균단가 KRW" value={form.averagePriceKrw} onChange={(value) => updateField("averagePriceKrw", value)} placeholder="68000" suffix="원" />
              <NumberField label="현재가 KRW" value={form.currentPriceKrw} onChange={(value) => updateField("currentPriceKrw", value)} placeholder="70000" suffix="원" />
            </>
          ) : null}

          {form.type === "US_STOCK" ? (
            <>
              <TextField label="티커" value={form.ticker} onChange={(value) => updateField("ticker", value.toUpperCase())} placeholder="예: TSLA" />
              <NumberField label="보유 수량" value={form.quantity} onChange={(value) => updateField("quantity", value)} placeholder="3" suffix="주" />
              <NumberField label="매수 평균단가 USD" value={form.averagePriceUsd} onChange={(value) => updateField("averagePriceUsd", value)} placeholder="240" suffix="USD" />
              <NumberField label="현재가 USD" value={form.currentPriceUsd} onChange={(value) => updateField("currentPriceUsd", value)} placeholder="260" suffix="USD" />
            </>
          ) : null}

          <TextField label="메모" value={form.memo} onChange={(value) => updateField("memo", value)} placeholder="필요한 기록을 남겨보세요" multiline />
        </div>

        <div className="form-actions">
          <button className="button ghost" type="button" onClick={onCancel}>
            취소
          </button>
          <button className="button primary" disabled={!canModify} type="submit">
            저장
          </button>
        </div>
      </form>
    </section>
  );
}

interface AssetDetailViewProps {
  asset?: Asset;
  canModify: boolean;
  onBack: () => void;
  onDelete: (asset: Asset) => void;
  onEdit: (assetId: string) => void;
}

function AssetDetailView({ asset, canModify, onBack, onDelete, onEdit }: AssetDetailViewProps) {
  if (!asset) {
    return (
      <section className="screen-stack narrow">
        <EmptyState message="자산을 찾을 수 없습니다." onCreate={onBack} actionLabel="목록으로 돌아가기" />
      </section>
    );
  }

  return (
    <section className="screen-stack narrow">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{ASSET_TYPE_LABELS[asset.type]}</p>
          <h2>{asset.name}</h2>
          <p className="muted">{getAssetPrimaryInfo(asset)}</p>
          <p className="muted">{getAssetUnitPriceInfo(asset)}</p>
        </div>
      </header>

      <section className="detail-card">
        <MetricRow label="매수원금" value={getAssetFormattedPurchaseAmount(asset)} />
        <MetricRow label="현재 평가금액" value={getAssetFormattedCurrentValue(asset)} />
        <MetricRow label="평가손익" value={getAssetFormattedProfitLoss(asset)} />
        <MetricRow label="수익률" value={getAssetFormattedReturnRate(asset)} />
        <MetricRow label="통화 단위" value={asset.type === "US_STOCK" ? "USD" : "KRW"} />
      </section>

      <section className="card memo-card">
        <h3>메모</h3>
        <p>{asset.memo ? asset.memo : "등록된 메모가 없습니다."}</p>
      </section>

      <div className="form-actions">
        <button className="button ghost" type="button" onClick={onBack}>
          목록
        </button>
        <button className="button secondary" disabled={!canModify} type="button" onClick={() => onEdit(asset.id)}>
          수정
        </button>
        <button className="button danger" disabled={!canModify} type="button" onClick={() => onDelete(asset)}>
          삭제
        </button>
      </div>
    </section>
  );
}

interface AssetCardProps {
  asset: Asset;
  canModify: boolean;
  onDelete?: (asset: Asset) => void;
  onDetail: (assetId: string) => void;
  onEdit: (assetId: string) => void;
}

function AssetCard({ asset, canModify, onDelete, onDetail, onEdit }: AssetCardProps) {
  const profitLoss = calculateAssetProfitLoss(asset);

  return (
    <article className="asset-card">
      <div className="asset-card-header">
        <div>
          <span className="asset-type">{ASSET_TYPE_LABELS[asset.type]}</span>
          <h3>{asset.name}</h3>
        </div>
        <span className="currency-pill">{asset.type === "US_STOCK" ? "USD" : "KRW"}</span>
      </div>
      <p className="asset-line">{getAssetPrimaryInfo(asset)}</p>
      <p className="asset-line">{getAssetUnitPriceInfo(asset)}</p>

      <div className="asset-metrics">
        <div>
          <span>평가금액</span>
          <strong>{getAssetFormattedCurrentValue(asset)}</strong>
        </div>
        <div className="align-right">
          <span>평가손익</span>
          <strong style={{ color: getProfitColor(profitLoss) }}>{getAssetFormattedProfitLoss(asset)}</strong>
          <small style={{ color: getProfitColor(profitLoss) }}>{getAssetFormattedReturnRate(asset)}</small>
        </div>
      </div>

      <div className="card-actions">
        <button className="small-button" type="button" onClick={() => onDetail(asset.id)}>
          상세
        </button>
        <button className="small-button" disabled={!canModify} type="button" onClick={() => onEdit(asset.id)}>
          수정
        </button>
        {onDelete ? (
          <button className="small-button danger-text" disabled={!canModify} type="button" onClick={() => onDelete(asset)}>
            삭제
          </button>
        ) : null}
      </div>
    </article>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
  details: Array<[string, string]>;
  tone: "blue" | "green";
}

function SummaryTile({ label, value, details, tone }: SummaryTileProps) {
  return (
    <article className={`summary-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <dl>
        {details.map(([detailLabel, detailValue]) => (
          <div key={detailLabel}>
            <dt>{detailLabel}</dt>
            <dd>{detailValue}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function TextField({ label, value, onChange, placeholder, multiline }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" />
      )}
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
}

function NumberField({ label, value, onChange, placeholder, suffix }: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-suffix">
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(sanitizeNumberInput(event.target.value))}
          placeholder={placeholder}
          type="text"
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface EmptyStateProps {
  actionLabel?: string;
  message?: string;
  onCreate: () => void;
}

function EmptyState({ actionLabel = "첫 자산 추가", message = "아직 등록된 자산이 없습니다. 첫 자산을 추가해보세요.", onCreate }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      <button className="button primary" type="button" onClick={onCreate}>
        {actionLabel}
      </button>
    </div>
  );
}

const compareAssets = (a: Asset, b: Asset, sort: SortType): number => {
  if (sort === "VALUE") {
    return calculateAssetCurrentValue(b) - calculateAssetCurrentValue(a);
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

const createAppTitle = (titlePrefix: string): string => {
  const trimmedPrefix = titlePrefix.trim();
  return trimmedPrefix.length > 0 ? `${trimmedPrefix} 자산 노트` : "자산 노트";
};

const loadTitlePrefix = (): string => {
  try {
    return window.localStorage.getItem(TITLE_PREFIX_STORAGE_KEY) ?? "우리";
  } catch {
    return "우리";
  }
};

const saveTitlePrefix = (titlePrefix: string): void => {
  try {
    window.localStorage.setItem(TITLE_PREFIX_STORAGE_KEY, titlePrefix);
  } catch {
    // 제목 저장 실패는 자산 데이터 저장과 무관하므로 조용히 무시합니다.
  }
};

const loadChangeUnlocked = (): boolean => {
  try {
    return window.sessionStorage.getItem(CHANGE_UNLOCKED_SESSION_KEY) === "true";
  } catch {
    return false;
  }
};

const saveChangeUnlocked = (isUnlocked: boolean): void => {
  try {
    if (isUnlocked) {
      window.sessionStorage.setItem(CHANGE_UNLOCKED_SESSION_KEY, "true");
      return;
    }
    window.sessionStorage.removeItem(CHANGE_UNLOCKED_SESSION_KEY);
  } catch {
    // 세션 저장소를 사용할 수 없어도 현재 화면의 잠금 상태는 유지됩니다.
  }
};
