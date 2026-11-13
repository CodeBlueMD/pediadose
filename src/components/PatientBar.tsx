import React, { useEffect, useState } from 'react';
import type { AgeUnit, WeightUnit } from '../types/medication';
import {
  ageToDays,
  estimatedWeightKg,
  formatNumber,
  getAgeBand,
  parseDecimal,
} from '../engine/doseCalculator';

interface PatientBarProps {
  weightKg: number;
  weightUnit: WeightUnit;
  ageValue: number;
  ageUnit: AgeUnit;
  onWeightKgChange: (kg: number) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
  onAgeChange: (value: number, unit: AgeUnit) => void;
}

const QUICK_WEIGHTS = [3.5, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60];

export const PatientBar: React.FC<PatientBarProps> = ({
  weightKg,
  weightUnit,
  ageValue,
  ageUnit,
  onWeightKgChange,
  onWeightUnitChange,
  onAgeChange,
}) => {
  const displayWeight = weightUnit === 'kg' ? weightKg : weightKg * 2.2046226218;
  const [weightText, setWeightText] = useState(formatNumber(displayWeight, 1));
  const [ageText, setAgeText] = useState(formatNumber(ageValue, 1));

  useEffect(() => {
    const val = weightUnit === 'kg' ? weightKg : weightKg * 2.2046226218;
    setWeightText(formatNumber(val, 1));
  }, [weightKg, weightUnit]);

  useEffect(() => {
    setAgeText(formatNumber(ageValue, 1));
  }, [ageValue]);

  const ageInDays = ageToDays(ageValue, ageUnit);
  const ageBand = getAgeBand(ageInDays);
  const weightLbs = weightKg * 2.2046226218;

  return (
    <div className="patient-bar">
      <div className="patient-grid">
        <div>
          <label className="field-label" htmlFor="patient-weight-input">
            Patient Weight ({formatNumber(weightKg, 1)} kg · {formatNumber(weightLbs, 1)} lb)
          </label>
          <div className="input-group">
            <input
              id="patient-weight-input"
              className="text-input"
              inputMode="decimal"
              value={weightText}
              onChange={(e) => {
                const raw = e.target.value;
                setWeightText(raw);
                const parsed = parseDecimal(raw);
                if (parsed !== null && parsed > 0) {
                  const kg = weightUnit === 'kg' ? parsed : parsed / 2.2046226218;
                  onWeightKgChange(Math.max(0.5, Math.min(150, kg)));
                }
              }}
            />
            <div className="segmented" role="group" aria-label="Weight unit">
              {(['kg', 'lb'] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={weightUnit === u ? 'active' : ''}
                  onClick={() => onWeightUnitChange(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="patient-age-input">
            Patient Age ({ageBand})
          </label>
          <div className="input-group">
            <input
              id="patient-age-input"
              className="text-input"
              inputMode="decimal"
              value={ageText}
              onChange={(e) => {
                const raw = e.target.value;
                setAgeText(raw);
                const parsed = parseDecimal(raw);
                if (parsed !== null && parsed >= 0) {
                  onAgeChange(parsed, ageUnit);
                }
              }}
            />
            <div className="segmented" role="group" aria-label="Age unit">
              {(['days', 'months', 'years'] as AgeUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={ageUnit === u ? 'active' : ''}
                  onClick={() => onAgeChange(ageValue, u)}
                >
                  {u === 'days' ? 'd' : u === 'months' ? 'mo' : 'yr'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="preset-strip">
        {QUICK_WEIGHTS.map((kg) => (
          <button
            key={kg}
            type="button"
            className={`chip ${Math.abs(weightKg - kg) < 0.05 ? 'active' : ''}`}
            onClick={() => onWeightKgChange(kg)}
          >
            {formatNumber(kg, 1)} kg
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            const est = estimatedWeightKg(ageInDays / 365.25, ageInDays / 30.4375);
            onWeightKgChange(est);
          }}
        >
          Est. Wt from Age
        </button>
      </div>
    </div>
  );
};
