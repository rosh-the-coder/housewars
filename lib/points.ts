export type MetricType = string;

export function resolveTimeMetricPoints(metricValue: number, metricType: MetricType): number {
  const normalizedType = metricType.toLowerCase();
  const avgReactionMs = Math.max(0, metricValue);
  const cap = normalizedType.includes("_hard")
    ? 500
    : normalizedType.includes("_medium")
      ? 250
      : 100;
  const failedRun = normalizedType.includes("_fail");

  const reactionRatio = Math.max(0, Math.min(1, (1500 - avgReactionMs) / 1200));
  const floorRatio = failedRun ? 0 : 0.2;
  const scaled = cap * (floorRatio + (1 - floorRatio) * reactionRatio);
  const penalized = failedRun ? scaled * 0.35 : scaled;

  return Math.max(0, Math.min(cap, Math.round(penalized)));
}

export function resolveBasePoints(input: {
  metricValue?: number;
  metricType?: string;
  fallbackRawScore?: number;
  isScored: boolean;
  durationSeconds: number;
  ptsPerMinute: number;
}): { basePoints: number; rawScore: number } {
  const {
    metricValue,
    metricType = "",
    fallbackRawScore = 0,
    isScored,
    durationSeconds,
    ptsPerMinute,
  } = input;

  const metricNum = Number(metricValue);
  const hasMetric = Number.isFinite(metricNum);
  const normalizedMetricType = metricType.trim().toLowerCase();

  let pointsFromMetric: number | null = null;
  let rawScore = Number(fallbackRawScore ?? 0);

  if (hasMetric) {
    if (normalizedMetricType.startsWith("time")) {
      pointsFromMetric = resolveTimeMetricPoints(metricNum, normalizedMetricType);
      rawScore = pointsFromMetric * 10;
    } else {
      rawScore = Math.max(0, Math.round(metricNum));
    }
  }

  const basePoints =
    pointsFromMetric ??
    (isScored
      ? Math.min(Math.floor(rawScore / 10), 500)
      : Math.floor(durationSeconds / 60) * Number(ptsPerMinute ?? 0));

  return {
    basePoints,
    rawScore,
  };
}

export function resolveCpFromBase(basePoints: number, multiplier: number): number {
  const safeBase = Math.max(0, Math.round(basePoints));
  const safeMultiplier = Number.isFinite(multiplier) ? Math.max(0, multiplier) : 1;
  return Math.round(safeBase * safeMultiplier);
}
