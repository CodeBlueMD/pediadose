import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Star } from 'lucide-react';
import type { Medication } from '../types/medication';
import {
  calculateDose,
  formatNumber,
  isFormulationCompatible,
  unitLabelForBasis,
} from '../engine/doseCalculator';

interface MedicationDetailProps {
  medication: Medication;
  weightKg: number;
  ageInDays: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onCopyOrder: (indicationName: string, rxOrderText: string) => void;
  onBack: () => void;
}

export const MedicationDetail: React.FC<MedicationDetailProps> = ({
  medication,
  weightKg,
  ageInDays,
  isFavorite,
  onToggleFavorite,
  onCopyOrder,
  onBack,
}) => {
  const [indicationId, setIndicationId] = useState(medication.indications[0].id);
  const selectedIndication = useMemo(
    () => medication.indications.find((i) => i.id === indicationId) ?? medication.indications[0],
    [medication, indicationId]
  );

  const compatibleFormulations = useMemo(() => {
    const list = medication.formulations.filter((f) =>
      isFormulationCompatible(f, selectedIndication.route)
    );
    return list.length > 0 ? list : medication.formulations;
  }, [medication, selectedIndication]);

  const [formulationId, setFormulationId] = useState(compatibleFormulations[0].id);
  const selectedFormulation = useMemo(
    () => compatibleFormulations.find((f) => f.id === formulationId) ?? compatibleFormulations[0],
    [compatibleFormulations, formulationId]
  );

  const [doseRate, setDoseRate] = useState(selectedIndication.defaultDose);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDoseRate(selectedIndication.defaultDose);
    if (!compatibleFormulations.some((f) => f.id === formulationId)) {
      setFormulationId(compatibleFormulations[0].id);
    }
  }, [selectedIndication, compatibleFormulations, formulationId]);

  const clampedRate = Math.max(
    selectedIndication.minDose,
    Math.min(selectedIndication.maxDose, doseRate)
  );

  const result = useMemo(
    () =>
      calculateDose({
        weightKg,
        ageInDays,
        medication,
        indication: selectedIndication,
        formulation: selectedFormulation,
        selectedDoseValue: clampedRate,
      }),
    [weightKg, ageInDays, medication, selectedIndication, selectedFormulation, clampedRate]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.rxOrderText);
    } catch {
      // Clipboard fallback ignored if blocked by browser permissions
    }
    onCopyOrder(selectedIndication.name, result.rxOrderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="chip"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <button
          type="button"
          className="chip"
          onClick={() => onToggleFavorite(medication.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
        >
          <Star size={15} fill={isFavorite ? '#eab308' : 'none'} color={isFavorite ? '#eab308' : 'currentColor'} />
          {isFavorite ? 'Pinned' : 'Pin Favorite'}
        </button>
      </div>

      <div>
        <h2 style={{ margin: 0, fontSize: '1.45rem' }}>{medication.genericName}</h2>
        {medication.brandNames.length > 0 && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {medication.brandNames.join(', ')} · {medication.category}
          </div>
        )}
      </div>

      {result.warnings.map((w, idx) => (
        <div key={idx} className={`warning-banner ${w.severity}`}>
          <div>
            <strong style={{ textTransform: 'uppercase', fontSize: '0.72rem', display: 'block' }}>
              {w.severity === 'info' ? 'Cap Applied' : w.severity}
            </strong>
            <span>{w.message}</span>
          </div>
        </div>
      ))}

      <div className="result-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div className="field-label">Recommended Dose</div>
            <div className="result-big">
              {result.formattedPracticalVolume ??
                result.practicalTabletText ??
                result.formattedSingleDose}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              {selectedIndication.route}
            </span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
              {selectedIndication.frequencyLabel}
            </div>
          </div>
        </div>

        {selectedIndication.doseBasis !== 'mLPerKgPerDose' && (
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="field-label">Single Dose</div>
              <strong>{result.formattedSingleDose}</strong>
            </div>
            {selectedIndication.dosesPerDay > 1 && (
              <div>
                <div className="field-label">Total Daily</div>
                <strong>{result.formattedDailyDose}</strong>
              </div>
            )}
            {result.volumeMlPerDose !== undefined && (
              <div>
                <div className="field-label">Exact Volume</div>
                <strong>{formatNumber(result.volumeMlPerDose, 2)} mL</strong>
              </div>
            )}
          </div>
        )}

        <div className="rx-box">{result.rxOrderText}</div>

        <button
          type="button"
          className={`primary-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? 'Copied to Clipboard' : 'Copy Rx Order'}
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <label className="field-label" htmlFor="indication-select">
          Indication &amp; Target Rate
        </label>
        {medication.indications.length > 1 ? (
          <select
            id="indication-select"
            className="text-input"
            value={selectedIndication.id}
            onChange={(e) => setIndicationId(e.target.value)}
          >
            {medication.indications.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name} ({ind.route})
              </option>
            ))}
          </select>
        ) : (
          <div style={{ fontWeight: 600 }}>{selectedIndication.name}</div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Target Rate</span>
          <strong style={{ color: 'var(--accent)' }}>
            {formatNumber(clampedRate, 2)} {unitLabelForBasis(selectedIndication.doseBasis)}
          </strong>
        </div>

        {selectedIndication.maxDose > selectedIndication.minDose && (
          <div style={{ marginTop: 8 }}>
            <input
              type="range"
              aria-label="Target dose rate"
              min={selectedIndication.minDose}
              max={selectedIndication.maxDose}
              step={
                (selectedIndication.maxDose - selectedIndication.minDose) / 20 >= 1
                  ? 1
                  : 0.1
              }
              value={clampedRate}
              onChange={(e) => setDoseRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>Min: {formatNumber(selectedIndication.minDose, 2)}</span>
              <span>Default: {formatNumber(selectedIndication.defaultDose, 2)}</span>
              <span>Max: {formatNumber(selectedIndication.maxDose, 2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="field-label">Formulation / Bottle Strength ({selectedIndication.route} Compatible)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {compatibleFormulations.map((form) => {
            const active = form.id === selectedFormulation.id;
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setFormulationId(form.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{form.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.type}</div>
                </div>
                {active && <Check size={16} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="field-label">Clinical Pearls &amp; Reference</div>
        <p style={{ margin: '6px 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
          {selectedIndication.clinicalPearls}
        </p>
        {selectedIndication.renalNote && (
          <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#b45309' }}>
            <strong>Renal:</strong> {selectedIndication.renalNote}
          </p>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Reference: {selectedIndication.referenceSource}
        </p>
      </div>
    </div>
  );
};
