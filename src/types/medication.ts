export type DrugCategory =
  | 'Antipyretics & Pain'
  | 'Antibiotics & Anti-infectives'
  | 'Respiratory & Asthma'
  | 'Steroids & Endocrine'
  | 'GI & Antiemetics'
  | 'Allergy & ENT'
  | 'Emergency & Resuscitation'
  | 'Neuro & Seizure'
  | 'Fluids & Electrolytes';

export const ALL_CATEGORIES: DrugCategory[] = [
  'Antipyretics & Pain',
  'Antibiotics & Anti-infectives',
  'Respiratory & Asthma',
  'Steroids & Endocrine',
  'GI & Antiemetics',
  'Allergy & ENT',
  'Emergency & Resuscitation',
  'Neuro & Seizure',
  'Fluids & Electrolytes',
];

export type Route = 'PO' | 'IV' | 'IM' | 'IO' | 'IV/IO' | 'PR' | 'NEB' | 'MDI' | 'TOP';

export type DoseBasis =
  | 'mgPerKgPerDose'
  | 'mgPerKgPerDay'
  | 'mcgPerKgPerDose'
  | 'mLPerKgPerDose'
  | 'fixedMgPerDose';

export type FormulationType =
  | 'Oral Liquid / Syrup'
  | 'Oral Drops'
  | 'Tablet / Chewable'
  | 'Capsule'
  | 'Powder / Capful'
  | 'IV / IM Vial'
  | 'Nebulizer Solution'
  | 'Suppository'
  | 'Auto-Injector'
  | 'IV Solution';

export interface Formulation {
  id: string;
  label: string;
  type: FormulationType;
  strengthValue: number;
  volumeMl?: number;
  isMicrogram: boolean;
  splittable: boolean;
  compatibleRoutes?: Route[];
}

export interface DosingIndication {
  id: string;
  name: string;
  route: Route;
  doseBasis: DoseBasis;
  minDose: number;
  maxDose: number;
  defaultDose: number;
  dosesPerDay: number;
  frequencyLabel: string;
  durationNote?: string;
  maxSingleDose?: number;
  maxDailyDose?: number;
  minAgeDays?: number;
  maxAgeYears?: number;
  ageWarningText?: string;
  renalNote?: string;
  clinicalPearls: string;
  referenceSource: string;
}

export interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
  category: DrugCategory;
  summary: string;
  isEmergency: boolean;
  indications: DosingIndication[];
  formulations: Formulation[];
}

export type WeightUnit = 'kg' | 'lb';
export type AgeUnit = 'days' | 'months' | 'years';
