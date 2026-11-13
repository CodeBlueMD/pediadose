import type {
  AgeUnit,
  DoseBasis,
  DosingIndication,
  Formulation,
  FormulationType,
  Medication,
  Route,
} from '../types/medication';

export interface DoseWarning {
  severity: 'critical' | 'caution' | 'info';
  message: string;
}

export interface DoseCalculationResult {
  singleDoseMg: number;
  dailyDoseMg: number;
  isMicrogramDisplay: boolean;
  formattedSingleDose: string;
  formattedDailyDose: string;
  volumeMlPerDose?: number;
  practicalVolumeMl?: number;
  formattedPracticalVolume?: string;
  tabletCountPerDose?: number;
  practicalTabletText?: string;
  actualDeliveredMg?: number;
  tabletVariancePercent?: number;
  isCappedAtSingleMax: boolean;
  isCappedAtDailyMax: boolean;
  warnings: DoseWarning[];
  rxOrderText: string;
}

export interface MaintenanceFluidResult {
  hourlyRateMlHr: number;
  dailyTotalMl: number;
  bolus20MlKg: number;
  bolus10MlKg: number;
  isCappedAtAdultMax: boolean;
}

export function ageToDays(value: number, unit: AgeUnit): number {
  switch (unit) {
    case 'days':
      return value;
    case 'months':
      return value * 30.4375;
    case 'years':
      return value * 365.25;
  }
}

export function getAgeBand(ageInDays: number): string {
  if (ageInDays < 28) return 'Neonate (<28d)';
  if (ageInDays < 365.25) return 'Infant (1–12m)';
  if (ageInDays / 365.25 < 4) return 'Toddler (1–3y)';
  if (ageInDays / 365.25 < 12) return 'Child (4–11y)';
  return 'Adolescent (12+y)';
}

export function estimatedWeightKg(ageYears: number, ageMonths: number): number {
  if (ageMonths < 12) {
    return Math.max(3.0, 0.5 * ageMonths + 4.0);
  } else if (ageYears <= 5) {
    return 2.0 * ageYears + 8.0;
  } else if (ageYears <= 12) {
    return 3.0 * ageYears + 7.0;
  }
  return Math.min(70.0, 3.0 * ageYears + 7.0);
}

export function unitLabelForBasis(basis: DoseBasis): string {
  switch (basis) {
    case 'mgPerKgPerDose':
      return 'mg/kg/dose';
    case 'mgPerKgPerDay':
      return 'mg/kg/day';
    case 'mcgPerKgPerDose':
      return 'mcg/kg/dose';
    case 'mLPerKgPerDose':
      return 'mL/kg/dose';
    case 'fixedMgPerDose':
      return 'mg/dose';
  }
}

export function isFormulationCompatible(form: Formulation, route: Route): boolean {
  if (form.compatibleRoutes && form.compatibleRoutes.length > 0) {
    return form.compatibleRoutes.includes(route);
  }
  switch (form.type) {
    case 'Oral Liquid / Syrup':
    case 'Oral Drops':
    case 'Tablet / Chewable':
    case 'Capsule':
    case 'Powder / Capful':
      return route === 'PO';
    case 'Suppository':
      return route === 'PR';
    case 'Nebulizer Solution':
      return route === 'NEB' || route === 'MDI';
    case 'IV / IM Vial':
      return route === 'IV' || route === 'IM' || route === 'IO' || route === 'IV/IO';
    case 'IV Solution':
      return route === 'IV' || route === 'IO' || route === 'IV/IO';
    case 'Auto-Injector':
      return route === 'IM';
  }
}

export function formatNumber(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  if (decimals > 0 && fixed.includes('.')) {
    return fixed.replace(/0+$/, '').replace(/\.$/, '');
  }
  return fixed;
}

export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function roundPracticalVolume(volume: number, isIV: boolean): number {
  if (isIV) {
    if (volume < 1.0) return Math.round(volume * 100) / 100;
    if (volume < 10.0) return Math.round(volume * 10) / 10;
    return Math.round(volume);
  } else {
    if (volume < 1.0) return Math.round(volume * 10) / 10;
    if (volume < 5.0) return Math.round(volume * 10) / 10;
    return Math.round(volume * 2) / 2;
  }
}

export function formatTabletCount(count: number, formType: FormulationType): string {
  const singular = count <= 1.01;
  let unitWord: string;
  switch (formType) {
    case 'Capsule':
      unitWord = singular ? 'cap' : 'caps';
      break;
    case 'Suppository':
      unitWord = singular ? 'supp' : 'supps';
      break;
    case 'Auto-Injector':
      unitWord = singular ? 'pen' : 'pens';
      break;
    case 'Powder / Capful':
      unitWord = singular ? 'capful' : 'capfuls';
      break;
    default:
      unitWord = singular ? 'tab' : 'tabs';
  }

  if (Math.abs(count - 0.5) < 0.01) return `½ ${unitWord}`;
  if (Math.abs((count % 1) - 0.5) < 0.01) return `${Math.floor(count)}½ ${unitWord}`;
  if (count === Math.floor(count)) return `${Math.floor(count)} ${unitWord}`;
  return `${count.toFixed(1)} ${unitWord}`;
}

export function calculateMaintenanceFluids(weightKg: number): MaintenanceFluidResult {
  let rawHourly: number;
  if (weightKg <= 10.0) {
    rawHourly = weightKg * 4.0;
  } else if (weightKg <= 20.0) {
    rawHourly = 40.0 + (weightKg - 10.0) * 2.0;
  } else {
    rawHourly = 60.0 + (weightKg - 20.0) * 1.0;
  }
  const cappedHourly = Math.min(100.0, rawHourly);
  return {
    hourlyRateMlHr: cappedHourly,
    dailyTotalMl: cappedHourly * 24.0,
    bolus20MlKg: Math.min(2000.0, weightKg * 20.0),
    bolus10MlKg: Math.min(1000.0, weightKg * 10.0),
    isCappedAtAdultMax: rawHourly > 100.0,
  };
}

export function calculateDose(params: {
  weightKg: number;
  ageInDays: number;
  medication: Medication;
  indication: DosingIndication;
  formulation: Formulation;
  selectedDoseValue?: number;
}): DoseCalculationResult {
  const { weightKg, ageInDays, medication, indication, formulation, selectedDoseValue } = params;
  const targetRate = Math.max(
    indication.minDose,
    Math.min(indication.maxDose, selectedDoseValue ?? indication.defaultDose)
  );
  const dosesPerDay = Math.max(1.0, indication.dosesPerDay);
  const warnings: DoseWarning[] = [];

  if (indication.minAgeDays !== undefined && ageInDays < indication.minAgeDays) {
    warnings.push({
      severity: 'critical',
      message:
        indication.ageWarningText ??
        'Patient age is below the recommended minimum age for this indication.',
    });
  } else if (indication.ageWarningText && ageInDays < 60) {
    warnings.push({ severity: 'caution', message: indication.ageWarningText });
  }

  if (indication.maxAgeYears !== undefined && ageInDays / 365.25 > indication.maxAgeYears) {
    warnings.push({
      severity: 'caution',
      message: `Patient age exceeds ${formatNumber(indication.maxAgeYears, 1)} years; verify guideline tier.`,
    });
  }

  if (indication.doseBasis === 'mLPerKgPerDose') {
    const rawMl = targetRate * weightKg;
    let cappedMl = rawMl;
    let cappedSingle = false;
    if (indication.maxSingleDose !== undefined && cappedMl > indication.maxSingleDose) {
      cappedMl = indication.maxSingleDose;
      cappedSingle = true;
      const maxDec =
        indication.maxSingleDose < 1.0 ? 2 : indication.maxSingleDose < 10.0 ? 1 : 0;
      warnings.push({
        severity: 'info',
        message: `Capped at maximum single volume of ${formatNumber(indication.maxSingleDose, maxDec)} mL.`,
      });
    }
    const isIVorNeb = ['IV', 'IM', 'IO', 'IV/IO', 'NEB'].includes(indication.route);
    const practicalMl = roundPracticalVolume(cappedMl, isIVorNeb);
    const volDec = practicalMl < 1.0 ? 2 : practicalMl < 10.0 ? 1 : 0;
    const rateDec = targetRate < 1.0 ? 2 : 0;
    const formattedPractical = `${formatNumber(practicalMl, volDec)} mL`;
    const rxOrderText = `${medication.genericName} ${indication.route} — Give ${formattedPractical} (${formatNumber(targetRate, rateDec)} mL/kg) ${indication.frequencyLabel}`;

    return {
      singleDoseMg: 0,
      dailyDoseMg: 0,
      isMicrogramDisplay: false,
      formattedSingleDose: '0 mg',
      formattedDailyDose: '0 mg/day',
      volumeMlPerDose: cappedMl,
      practicalVolumeMl: practicalMl,
      formattedPracticalVolume: formattedPractical,
      isCappedAtSingleMax: cappedSingle,
      isCappedAtDailyMax: false,
      warnings,
      rxOrderText,
    };
  }

  const isMicrogram = indication.doseBasis === 'mcgPerKgPerDose';
  let rawSingleMg = 0;
  switch (indication.doseBasis) {
    case 'mgPerKgPerDose':
      rawSingleMg = targetRate * weightKg;
      break;
    case 'mgPerKgPerDay':
      rawSingleMg = (targetRate * weightKg) / dosesPerDay;
      break;
    case 'mcgPerKgPerDose':
      rawSingleMg = (targetRate * weightKg) / 1000.0;
      break;
    case 'fixedMgPerDose':
      rawSingleMg = targetRate;
      break;
  }

  let singleMg = rawSingleMg;
  let isCappedSingle = false;
  let isCappedDaily = false;

  if (indication.maxSingleDose !== undefined) {
    const maxSingleMg = isMicrogram ? indication.maxSingleDose / 1000.0 : indication.maxSingleDose;
    if (singleMg > maxSingleMg) {
      singleMg = maxSingleMg;
      isCappedSingle = true;
    }
  }

  let dailyMg = singleMg * dosesPerDay;
  if (indication.maxDailyDose !== undefined) {
    const maxDailyMg = isMicrogram ? indication.maxDailyDose / 1000.0 : indication.maxDailyDose;
    if (dailyMg > maxDailyMg) {
      dailyMg = maxDailyMg;
      singleMg = maxDailyMg / dosesPerDay;
      isCappedDaily = true;
      if (indication.maxSingleDose !== undefined) {
        const maxSingleMg = isMicrogram
          ? indication.maxSingleDose / 1000.0
          : indication.maxSingleDose;
        if (singleMg < maxSingleMg - 0.0001) {
          isCappedSingle = false;
        }
      }
    }
  }

  if (isCappedSingle && indication.maxSingleDose !== undefined) {
    const unitStr = isMicrogram
      ? `${formatNumber(indication.maxSingleDose, 0)} mcg`
      : `${formatNumber(indication.maxSingleDose, indication.maxSingleDose < 10 ? 2 : 0)} mg`;
    warnings.push({ severity: 'info', message: `Capped at max single dose (${unitStr}).` });
  }

  if (isCappedDaily && indication.maxDailyDose !== undefined) {
    const unitStr = isMicrogram
      ? `${formatNumber(indication.maxDailyDose, 0)} mcg/day`
      : `${formatNumber(indication.maxDailyDose, indication.maxDailyDose < 10 ? 2 : 0)} mg/day`;
    warnings.push({ severity: 'info', message: `Capped at max daily dose (${unitStr}).` });
  }

  const isIVorIM = ['IV', 'IM', 'IO', 'IV/IO'].includes(indication.route);
  let exactVolMl: number | undefined;
  let practicalVolMl: number | undefined;
  let formattedPracticalVolume: string | undefined;
  let tabletCount: number | undefined;
  let practicalTabText: string | undefined;
  let actualDeliveredMg: number | undefined;
  let variancePct: number | undefined;

  if (formulation.volumeMl !== undefined && formulation.volumeMl > 0) {
    const mg = formulation.isMicrogram
      ? formulation.strengthValue / 1000.0
      : formulation.strengthValue;
    const mgPerMl = mg / formulation.volumeMl;
    if (mgPerMl > 0) {
      const vol = singleMg / mgPerMl;
      exactVolMl = vol;
      practicalVolMl = roundPracticalVolume(vol, isIVorIM);
      formattedPracticalVolume = `${formatNumber(practicalVolMl, practicalVolMl < 1.0 ? 2 : 1)} mL`;
    }
  } else {
    const mgPerUnit = formulation.isMicrogram
      ? formulation.strengthValue / 1000.0
      : formulation.strengthValue;
    if (mgPerUnit > 0) {
      const rawUnits = singleMg / mgPerUnit;
      tabletCount = rawUnits;
      const step = formulation.splittable ? 0.5 : 1.0;
      const roundedUnits = Math.max(step, Math.round(rawUnits / step) * step);
      const actualMg = roundedUnits * mgPerUnit;
      actualDeliveredMg = actualMg;
      if (singleMg > 0) {
        variancePct = ((actualMg - singleMg) / singleMg) * 100.0;
      }
      practicalTabText = formatTabletCount(roundedUnits, formulation.type);
      if (variancePct !== undefined && Math.abs(variancePct) > 20.0) {
        warnings.push({
          severity: 'caution',
          message: `Solid unit rounding (${formatNumber(actualMg, actualMg < 10 ? 2 : actualMg < 100 ? 1 : 0)} mg) differs from target by ${formatNumber(variancePct, 0)}%. Consider liquid formulation if available.`,
        });
      }
    }
  }

  const formattedSingleDose = isMicrogram
    ? `${formatNumber(singleMg * 1000.0, singleMg * 1000.0 < 10 ? 1 : 0)} mcg`
    : `${formatNumber(singleMg, singleMg < 10 ? 2 : singleMg < 100 ? 1 : 0)} mg`;

  const formattedDailyDose = isMicrogram
    ? `${formatNumber(dailyMg * 1000.0, dailyMg * 1000.0 < 10 ? 1 : 0)} mcg/day`
    : `${formatNumber(dailyMg, dailyMg < 10 ? 2 : dailyMg < 100 ? 1 : 0)} mg/day`;

  let adminAmountText = formattedSingleDose;
  if (formattedPracticalVolume) {
    adminAmountText = `${formattedPracticalVolume} (${formattedSingleDose})`;
  } else if (practicalTabText && actualDeliveredMg !== undefined) {
    const deliveredStr = `${formatNumber(actualDeliveredMg, actualDeliveredMg < 10 ? 2 : actualDeliveredMg < 100 ? 1 : 0)} mg`;
    adminAmountText =
      variancePct !== undefined && Math.abs(variancePct) > 5.0
        ? `${practicalTabText} [delivers ${deliveredStr}] (Target: ${formattedSingleDose})`
        : `${practicalTabText} (${deliveredStr})`;
  }

  const durationSuffix = indication.durationNote ? ` ${indication.durationNote}` : '';
  const rxOrderText = `${medication.genericName} [${formulation.label}] — Give ${adminAmountText} ${indication.route} ${indication.frequencyLabel}${durationSuffix}`;

  return {
    singleDoseMg: singleMg,
    dailyDoseMg: dailyMg,
    isMicrogramDisplay: isMicrogram,
    formattedSingleDose,
    formattedDailyDose,
    volumeMlPerDose: exactVolMl,
    practicalVolumeMl: practicalVolMl,
    formattedPracticalVolume,
    tabletCountPerDose: tabletCount,
    practicalTabletText: practicalTabText,
    actualDeliveredMg,
    tabletVariancePercent: variancePct,
    isCappedAtSingleMax: isCappedSingle,
    isCappedAtDailyMax: isCappedDaily,
    warnings,
    rxOrderText,
  };
}
