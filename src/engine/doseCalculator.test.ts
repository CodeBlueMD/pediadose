import { describe, expect, it } from 'vitest';
import formularyRaw from '../data/formulary.json';
import type { Medication } from '../types/medication';
import {
  calculateDose,
  calculateMaintenanceFluids,
  isFormulationCompatible,
  parseDecimal,
} from './doseCalculator';

const formulary = formularyRaw as Medication[];

describe('PediaDose Web Engine', () => {
  it('calculates Amoxicillin 90 mg/kg/day BID oral suspension accurately', () => {
    const amox = formulary.find((m) => m.id === 'amoxicillin')!;
    const ind = amox.indications.find((i) => i.id === 'amox-high')!;
    const form = amox.formulations.find((f) => f.id === 'amox-400-5')!;

    const res = calculateDose({
      weightKg: 15,
      ageInDays: 3 * 365.25,
      medication: amox,
      indication: ind,
      formulation: form,
      selectedDoseValue: 90,
    });

    expect(res.singleDoseMg).toBeCloseTo(675, 2);
    expect(res.practicalVolumeMl).toBeCloseTo(8.5, 2);
  });

  it('preserves 2-decimal precision for Racemic Epinephrine mL/kg', () => {
    const repi = formulary.find((m) => m.id === 'racemic-epi')!;
    const res = calculateDose({
      weightKg: 5,
      ageInDays: 120,
      medication: repi,
      indication: repi.indications[0],
      formulation: repi.formulations[0],
    });
    expect(res.rxOrderText).toContain('0.25 mL');
    expect(res.rxOrderText).toContain('0.05 mL/kg');
  });

  it('caps Holliday-Segar maintenance fluids at 100 mL/hr', () => {
    const f15 = calculateMaintenanceFluids(15);
    expect(f15.hourlyRateMlHr).toBe(50);
    expect(f15.isCappedAtAdultMax).toBe(false);

    const f100 = calculateMaintenanceFluids(100);
    expect(f100.hourlyRateMlHr).toBe(100);
    expect(f100.dailyTotalMl).toBe(2400);
    expect(f100.isCappedAtAdultMax).toBe(true);
  });

  it('parses both dot and comma decimal inputs', () => {
    expect(parseDecimal('12.5')).toBe(12.5);
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('')).toBeNull();
  });

  it('verifies all 49 medications have compatible formulations', () => {
    expect(formulary.length).toBeGreaterThanOrEqual(49);
    for (const med of formulary) {
      for (const form of med.formulations) {
        const ok = med.indications.some((ind) => isFormulationCompatible(form, ind.route));
        expect(ok, `${med.genericName} -> ${form.label}`).toBe(true);
      }
    }
  });
});
