const krwFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

export const formatKrw = (value: number): string => `${krwFormatter.format(Math.round(safeNumber(value)))}원`;

export const formatSignedKrw = (value: number): string => {
  const safeValue = safeNumber(value);
  if (safeValue > 0) {
    return `+${formatKrw(safeValue)}`;
  }
  if (safeValue < 0) {
    return `-${formatKrw(Math.abs(safeValue))}`;
  }
  return formatKrw(0);
};

export const formatUsd = (value: number): string => usdFormatter.format(safeNumber(value));

export const formatSignedUsd = (value: number): string => {
  const safeValue = safeNumber(value);
  if (safeValue > 0) {
    return `+${formatUsd(safeValue)}`;
  }
  return formatUsd(safeValue);
};

export const formatPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export const formatGram = (value: number): string => `${numberFormatter.format(safeNumber(value))}g`;

export const formatQuantity = (value: number): string => `${numberFormatter.format(safeNumber(value))}주`;

export const formatPlainNumber = (value: number): string => numberFormatter.format(safeNumber(value));

export const parseNumberInput = (value: string): number => {
  const normalized = value.replace(/,/g, "").trim();
  if (normalized.length === 0) {
    return NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const sanitizeNumberInput = (value: string, allowDecimal = true): string => {
  const filtered = value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");

  if (!allowDecimal) {
    return filtered;
  }

  const [firstPart, ...rest] = filtered.split(".");
  if (rest.length === 0) {
    return firstPart;
  }
  return `${firstPart}.${rest.join("")}`;
};
