import config from "../data/pricing-config.json";

export type TierId = "A" | "B" | "C";
export type SegmentGroup =
    | "foundation"
    | "sources"
    | "pages"
    | "dataLayer"
    | "extras"
    | "uplift"
    | "custom";

export interface Selection {
    sources: Record<TierId, number>;
    pages: Record<TierId, number>;
    semanticModel: string;
    analyticsEngineering: string;
    designSystem: string;
    onboarding: string;
    multipliers: Record<string, boolean>;
    customWork: string;
}

/**
 * One priced line in the stacked bar. `value` is exact; `display` is the
 * rounded figure shown to the user. The two differ because rounded segments
 * are reconciled against the rounded total (see `reconcileRounding`) so the
 * legend always sums to the headline — on a pricing chart, numbers that don't
 * add up are worse than numbers that are slightly imprecise.
 */
export interface Segment {
    id: string;
    group: SegmentGroup;
    /** Key into the strings dictionary for the human label. */
    labelKey: string;
    tierId?: TierId;
    optionId?: string;
    qty?: number;
    unitPrice?: number;
    /** Weighted taper factor across this tier's units, e.g. 0.85. 1 = no discount. */
    avgFactor?: number;
    /** Undiscounted price before taper, for showing the saving. */
    gross?: number;
    value: number;
    display: number;
}

export interface FreeItem {
    id: string;
    labelKey: string;
    listValue: number;
}

export interface Result {
    segments: Segment[];
    freeItems: FreeItem[];
    warnings: string[];
    multiplier: number;
    multiplierBase: number;
    multiplierCapped: boolean;
    subtotal: number;
    customWork: number;
    total: number;
    threshold: "none" | "soft" | "hard";
    priceListVersion: string;
    validityDays: number;
}

export const DEFAULT_SELECTION: Selection = {
    sources: { A: 1, B: 0, C: 0 },
    pages: { A: 3, B: 0, C: 0 },
    semanticModel: "compact",
    analyticsEngineering: "none",
    designSystem: "none",
    onboarding: "handover",
    multipliers: { multiTenant: false, rls: false, multiLanguage: false },
    customWork: "none",
};

interface TaperBand {
    fromUnit: number;
    toUnit: number | null;
    factor: number;
}

function factorForSlot(slot: number, taper: TaperBand[]): number {
    for (const band of taper) {
        const withinLower = slot >= band.fromUnit;
        const withinUpper = band.toUnit === null || slot <= band.toUnit;
        if (withinLower && withinUpper) return band.factor;
    }
    return 1;
}

interface TaperedTier {
    tierId: TierId;
    qty: number;
    unitPrice: number;
    gross: number;
    value: number;
    avgFactor: number;
}

/**
 * Allocates units to cumulative taper slots, cheapest tier first.
 *
 * The cheapest tier therefore consumes the earliest (undiscounted) slots and
 * the discount lands on the most expensive units — which always favours the
 * buyer, and is why a Tier B segment's value shifts when Tier A quantities
 * change. The legend surfaces this via `avgFactor` rather than hiding it.
 */
function taperTiers(
    tiers: { id: string; price: number }[],
    quantities: Record<string, number>,
    taper: TaperBand[],
): TaperedTier[] {
    const cheapestFirst = [...tiers].sort((a, b) => a.price - b.price);
    const rows: TaperedTier[] = [];
    let slot = 0;

    for (const tier of cheapestFirst) {
        const qty = quantities[tier.id] ?? 0;
        if (qty <= 0) continue;

        let value = 0;
        for (let unit = 0; unit < qty; unit++) {
            slot += 1;
            value += tier.price * factorForSlot(slot, taper);
        }

        const gross = tier.price * qty;
        rows.push({
            tierId: tier.id as TierId,
            qty,
            unitPrice: tier.price,
            gross,
            value,
            avgFactor: gross === 0 ? 1 : value / gross,
        });
    }

    return rows;
}

/**
 * Rounds segments to `step` using largest-remainder, so the rounded parts sum
 * exactly to the rounded whole. Naive per-segment rounding drifts by up to
 * n*step/2 and produces a legend that visibly fails to add up.
 */
function reconcileRounding(values: number[], step = 10): { display: number[]; total: number } {
    if (values.length === 0) return { display: [], total: 0 };

    const exactTotal = values.reduce((sum, v) => sum + v, 0);
    const targetTotal = Math.round(exactTotal / step) * step;

    const display = values.map((v) => Math.floor(v / step) * step);
    const flooredTotal = display.reduce((sum, v) => sum + v, 0);
    const stepsToDistribute = Math.round((targetTotal - flooredTotal) / step);

    const byRemainder = values
        .map((v, index) => ({ index, remainder: v / step - Math.floor(v / step) }))
        .sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < stepsToDistribute; i++) {
        display[byRemainder[i % byRemainder.length].index] += step;
    }

    return { display, total: targetTotal };
}

function totalUnits(quantities: Record<TierId, number>): number {
    return quantities.A + quantities.B + quantities.C;
}

export function calculate(selection: Selection): Result {
    const sourcesConfig = config.quantityItems.find((q) => q.id === "sources")!;
    const pagesConfig = config.quantityItems.find((q) => q.id === "pages")!;
    const semanticConfig = config.scopeItems.find((s) => s.id === "semanticModel")!;
    const transformConfig = config.scopeItems.find((s) => s.id === "analyticsEngineering")!;
    const designConfig = config.modules.find((m) => m.id === "designSystem")!;
    const onboardingConfig = config.modules.find((m) => m.id === "onboarding")!;
    const aiConfig = config.modules.find((m) => m.id === "aiReadiness")!;

    // Segments carrying delivery effort — these form the multiplier base.
    const effortSegments: Omit<Segment, "display">[] = [];

    effortSegments.push({
        id: "foundation",
        group: "foundation",
        labelKey: "foundation",
        value: config.base.price,
    });

    for (const row of taperTiers(sourcesConfig.tiers, selection.sources, sourcesConfig.taper as TaperBand[])) {
        effortSegments.push({
            id: `sources:${row.tierId}`,
            group: "sources",
            labelKey: `sources.${row.tierId}`,
            tierId: row.tierId,
            qty: row.qty,
            unitPrice: row.unitPrice,
            avgFactor: row.avgFactor,
            gross: row.gross,
            value: row.value,
        });
    }

    for (const row of taperTiers(pagesConfig.tiers, selection.pages, pagesConfig.taper as TaperBand[])) {
        effortSegments.push({
            id: `pages:${row.tierId}`,
            group: "pages",
            labelKey: `pages.${row.tierId}`,
            tierId: row.tierId,
            qty: row.qty,
            unitPrice: row.unitPrice,
            avgFactor: row.avgFactor,
            gross: row.gross,
            value: row.value,
        });
    }

    const semanticOption = semanticConfig.options.find((o) => o.id === selection.semanticModel);
    if (semanticOption && semanticOption.price > 0) {
        effortSegments.push({
            id: "semanticModel",
            group: "dataLayer",
            labelKey: `semanticModel.${semanticOption.id}`,
            optionId: semanticOption.id,
            value: semanticOption.price,
        });
    }

    const transformOption = transformConfig.options.find((o) => o.id === selection.analyticsEngineering);
    if (transformOption && transformOption.price > 0) {
        effortSegments.push({
            id: "analyticsEngineering",
            group: "dataLayer",
            labelKey: `analyticsEngineering.${transformOption.id}`,
            optionId: transformOption.id,
            value: transformOption.price,
        });
    }

    const designOption = designConfig.options!.find((o) => o.id === selection.designSystem);
    if (designOption && designOption.price > 0) {
        effortSegments.push({
            id: "designSystem",
            group: "extras",
            labelKey: `designSystem.${designOption.id}`,
            optionId: designOption.id,
            value: designOption.price,
        });
    }

    const onboardingOption = onboardingConfig.options!.find((o) => o.id === selection.onboarding);
    if (onboardingOption && onboardingOption.price > 0) {
        effortSegments.push({
            id: "onboarding",
            group: "extras",
            labelKey: `onboarding.${onboardingOption.id}`,
            optionId: onboardingOption.id,
            value: onboardingOption.price,
        });
    }

    const multiplierBase = effortSegments.reduce((sum, s) => sum + s.value, 0);

    const addedFactor = config.multipliers.factors
        .filter((f) => selection.multipliers[f.id])
        .reduce((sum, f) => sum + f.add, 0);
    const rawMultiplier = 1 + addedFactor;
    const multiplier = Math.min(rawMultiplier, config.multipliers.cap);
    const upliftValue = multiplierBase * (multiplier - 1);

    const allSegments = [...effortSegments];
    if (upliftValue > 0) {
        allSegments.push({
            id: "uplift",
            group: "uplift",
            labelKey: "uplift",
            value: upliftValue,
        });
    }

    // Prepaid hours sit outside the multiplier: they are sold at a published
    // rate, so scaling them by complexity would silently inflate the advertised
    // hourly price.
    const customBlock = config.hourly.blocks.find((b) => b.id === selection.customWork);
    const customWork = customBlock?.price ?? 0;
    if (customWork > 0) {
        allSegments.push({
            id: "customWork",
            group: "custom",
            labelKey: `customWork.${customBlock!.id}`,
            optionId: customBlock!.id,
            qty: customBlock!.hours,
            value: customWork,
        });
    }

    const { display, total } = reconcileRounding(allSegments.map((s) => s.value));
    const segments: Segment[] = allSegments.map((s, i) => ({ ...s, display: display[i] }));

    // Deliberately fixed, not derived from the selection: these three are
    // included in every engagement, and a constant list keeps the result panel
    // from changing height as options are toggled.
    const freeItems: FreeItem[] = [
        { id: "aiReadiness", labelKey: "aiReadiness", listValue: aiConfig.listValue! },
        { id: "handover", labelKey: "onboarding.handover", listValue: 0 },
        { id: "defaultTheme", labelKey: "designSystem.none", listValue: 0 },
    ];

    const sourceCount = totalUnits(selection.sources);
    const pageCount = totalUnits(selection.pages);
    const warnings: string[] = [];
    if (pageCount > 10 && sourceCount === 1) warnings.push("pagesPerSource");
    if (selection.analyticsEngineering === "advanced" && sourceCount <= 1) warnings.push("advancedNoSources");
    if (pageCount >= 15 && selection.semanticModel === "compact") warnings.push("pagesOnCompactModel");

    let threshold: Result["threshold"] = "none";
    if (total >= config.thresholds.hardContactAt) threshold = "hard";
    else if (total >= config.thresholds.softReviewAt) threshold = "soft";

    return {
        segments,
        freeItems,
        warnings,
        multiplier,
        multiplierBase,
        multiplierCapped: rawMultiplier > config.multipliers.cap,
        subtotal: multiplierBase * multiplier,
        customWork,
        total,
        threshold,
        priceListVersion: config.priceListVersion,
        validityDays: config.validityDays,
    };
}

export function formatCurrency(value: number, lang: "en" | "de"): string {
    return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-IE", {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: 0,
    }).format(value);
}

export { config as pricingConfig };
