import React, { useMemo, useState } from 'react';
import { BookOpen, HeartPulse, Pill, Star } from 'lucide-react';
import formularyRaw from './data/formulary.json';
import {
  ALL_CATEGORIES,
  type AgeUnit,
  type DrugCategory,
  type Medication,
  type WeightUnit,
} from './types/medication';
import {
  ageToDays,
  calculateDose,
  calculateMaintenanceFluids,
  formatNumber,
  isFormulationCompatible,
} from './engine/doseCalculator';
import { PatientBar } from './components/PatientBar';
import { MedicationDetail } from './components/MedicationDetail';
import { TermsModal } from './components/TermsModal';

type Tab = 'calculator' | 'emergency' | 'formulary' | 'saved';

interface RecentOrder {
  id: string;
  medName: string;
  indicationName: string;
  weightKg: number;
  rxOrderText: string;
  timestamp: string;
}

const ALL_MEDS = (formularyRaw as Medication[]).sort((a, b) =>
  a.genericName.localeCompare(b.genericName)
);

const DEFAULT_FAVS = [
  'acetaminophen',
  'ibuprofen',
  'amoxicillin',
  'ondansetron',
  'epinephrine-anaphylaxis',
];

export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('calculator');
  const [weightKg, setWeightKg] = useState(15);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [ageValue, setAgeValue] = useState(3);
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrugCategory | null>(null);
  const [activeMed, setActiveMed] = useState<Medication | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pediadose_favs_v1');
      return saved ? JSON.parse(saved) : DEFAULT_FAVS;
    } catch {
      return DEFAULT_FAVS;
    }
  });

  const [recents, setRecents] = useState<RecentOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pediadose_recents_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pediadose_terms_accepted_v1');
    } catch {
      return null;
    }
  });
  const [showTermsReadOnly, setShowTermsReadOnly] = useState(false);

  const ageInDays = useMemo(() => ageToDays(ageValue, ageUnit), [ageValue, ageUnit]);
  const fluids = useMemo(() => calculateMaintenanceFluids(weightKg), [weightKg]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('pediadose_favs_v1', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const recordOrder = (med: Medication, indicationName: string, rxOrderText: string) => {
    const entry: RecentOrder = {
      id: `${Date.now()}`,
      medName: med.genericName,
      indicationName,
      weightKg,
      rxOrderText,
      timestamp: new Date().toISOString(),
    };
    setRecents((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try {
        localStorage.setItem('pediadose_recents_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const filteredMeds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_MEDS.filter((m) => {
      if (selectedCategory && m.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        m.genericName.toLowerCase().includes(q) ||
        m.brandNames.some((b) => b.toLowerCase().includes(q)) ||
        m.summary.toLowerCase().includes(q) ||
        m.indications.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCategory]);

  const emergencyMeds = useMemo(
    () => ALL_MEDS.filter((m) => m.isEmergency || m.category === 'Emergency & Resuscitation'),
    []
  );

  const renderMedRow = (med: Medication) => {
    const firstInd = med.indications[0];
    const compatForm =
      med.formulations.find((f) => isFormulationCompatible(f, firstInd.route)) ??
      med.formulations[0];
    const preview = calculateDose({
      weightKg,
      ageInDays,
      medication: med,
      indication: firstInd,
      formulation: compatForm,
    });

    return (
      <button key={med.id} type="button" className="med-row" onClick={() => setActiveMed(med)}>
        <div>
          <div className="med-name">
            {med.genericName}{' '}
            {favorites.includes(med.id) && (
              <span style={{ color: '#eab308', fontSize: '0.85rem' }}>★</span>
            )}
          </div>
          <div className="med-sub">
            {med.brandNames.length > 0 ? `${med.brandNames.join(', ')} · ` : ''}
            {firstInd.route} · {firstInd.frequencyLabel}
          </div>
        </div>
        <div className="med-dose-preview">
          <div className="med-dose-vol">
            {preview.formattedPracticalVolume ??
              preview.practicalTabletText ??
              preview.formattedSingleDose}
          </div>
          {firstInd.doseBasis !== 'mLPerKgPerDose' && (
            <div className="med-dose-mg">{preview.formattedSingleDose}</div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="app-shell">
      {!termsAcceptedAt && (
        <TermsModal
          onAgree={() => {
            const now = new Date().toISOString();
            setTermsAcceptedAt(now);
            try {
              localStorage.setItem('pediadose_terms_accepted_v1', now);
            } catch {
              // ignore
            }
          }}
        />
      )}

      {showTermsReadOnly && (
        <TermsModal
          isReadOnly
          acceptedAt={termsAcceptedAt}
          onAgree={() => {}}
          onClose={() => setShowTermsReadOnly(false)}
        />
      )}

      <header className="topbar">
        <div className="brand">
          <div className="brand-badge">Rx</div>
          <div>
            <div className="brand-title">PediaDose</div>
            <div className="brand-sub">CodeBlueMD Pediatric Dosing</div>
          </div>
        </div>

        <nav className="desktop-tabs" aria-label="Main navigation">
          <button
            type="button"
            className={`tab-btn ${tab === 'calculator' ? 'active' : ''}`}
            onClick={() => {
              setTab('calculator');
              setActiveMed(null);
            }}
          >
            <Pill size={16} /> Calculator
          </button>
          <button
            type="button"
            className={`tab-btn emergency ${tab === 'emergency' ? 'active' : ''}`}
            onClick={() => {
              setTab('emergency');
              setActiveMed(null);
            }}
          >
            <HeartPulse size={16} /> Emergency
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'formulary' ? 'active' : ''}`}
            onClick={() => {
              setTab('formulary');
              setActiveMed(null);
            }}
          >
            <BookOpen size={16} /> Formulary
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              setTab('saved');
              setActiveMed(null);
            }}
          >
            <Star size={16} /> Saved
          </button>
        </nav>
      </header>

      <main className="main-content">
        <PatientBar
          weightKg={weightKg}
          weightUnit={weightUnit}
          ageValue={ageValue}
          ageUnit={ageUnit}
          onWeightKgChange={setWeightKg}
          onWeightUnitChange={setWeightUnit}
          onAgeChange={(val, unit) => {
            setAgeValue(val);
            setAgeUnit(unit);
          }}
        />

        {activeMed ? (
          <MedicationDetail
            medication={activeMed}
            weightKg={weightKg}
            ageInDays={ageInDays}
            isFavorite={favorites.includes(activeMed.id)}
            onToggleFavorite={toggleFavorite}
            onCopyOrder={(indName, rx) => recordOrder(activeMed, indName, rx)}
            onBack={() => setActiveMed(null)}
          />
        ) : (
          <>
            {tab === 'calculator' && (
              <>
                <input
                  className="search-box"
                  type="search"
                  placeholder="Search generic, brand, or indication..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="preset-strip" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
                  <button
                    type="button"
                    className={`chip ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All ({ALL_MEDS.length})
                  </button>
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {!search && !selectedCategory && favorites.length > 0 && (
                  <div>
                    <div className="section-title">Pinned Favorites</div>
                    <div className="card">
                      {ALL_MEDS.filter((m) => favorites.includes(m.id)).map(renderMedRow)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="section-title">
                    {selectedCategory ?? 'All Medications'} ({filteredMeds.length})
                  </div>
                  <div className="card">{filteredMeds.map(renderMedRow)}</div>
                </div>
              </>
            )}

            {tab === 'emergency' && (
              <>
                <div className="card" style={{ padding: 16 }}>
                  <div className="field-label">IV Fluids (Holliday-Segar 4-2-1 &amp; Bolus)</div>
                  <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Maintenance Rate
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                        {formatNumber(fluids.hourlyRateMlHr, 1)} mL/hr
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatNumber(fluids.dailyTotalMl, 0)} mL / 24h
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        20 mL/kg Bolus
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                        {formatNumber(fluids.bolus20MlKg, 0)} mL
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        10 mL/kg: {formatNumber(fluids.bolus10MlKg, 0)} mL
                      </div>
                    </div>
                  </div>
                  {fluids.isCappedAtAdultMax && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--info)' }}>
                      Capped at 100 mL/hr (2,400 mL/24h) standard adult ceiling.
                    </div>
                  )}
                </div>

                <div>
                  <div className="section-title">PALS / Critical Care Quick Doses</div>
                  <div className="card">{emergencyMeds.map(renderMedRow)}</div>
                </div>
              </>
            )}

            {tab === 'formulary' && (
              <>
                <input
                  className="search-box"
                  type="search"
                  placeholder="Filter formulary A–Z..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {ALL_CATEGORIES.map((cat) => {
                  const meds = filteredMeds.filter((m) => m.category === cat);
                  if (meds.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="section-title">{cat}</div>
                      <div className="card">{meds.map(renderMedRow)}</div>
                    </div>
                  );
                })}
              </>
            )}

            {tab === 'saved' && (
              <>
                <div>
                  <div className="section-title">Bookmarked Medications</div>
                  <div className="card">
                    {ALL_MEDS.filter((m) => favorites.includes(m.id)).map(renderMedRow)}
                  </div>
                </div>

                <div>
                  <div className="section-title">Recent Copied Orders</div>
                  <div className="card" style={{ padding: recents.length ? 0 : 16 }}>
                    {recents.length === 0 ? (
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        Copied Rx orders will appear here.
                      </div>
                    ) : (
                      recents.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>{r.medName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              {formatNumber(r.weightKg, 1)} kg
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {r.indicationName}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', marginTop: 4 }}>
                            {r.rxOrderText}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Terms, Liability Waiver &amp; Privacy</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Offline Formulary: {ALL_MEDS.length} pediatric medications · CodeBlueMD
                    </div>
                  </div>
                  <button type="button" className="chip active" onClick={() => setShowTermsReadOnly(true)}>
                    View Agreement
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={tab === 'calculator' ? 'active' : ''}
          onClick={() => {
            setTab('calculator');
            setActiveMed(null);
          }}
        >
          <Pill size={18} />
          <span>Calculator</span>
        </button>
        <button
          type="button"
          className={`emergency ${tab === 'emergency' ? 'active' : ''}`}
          onClick={() => {
            setTab('emergency');
            setActiveMed(null);
          }}
        >
          <HeartPulse size={18} />
          <span>Emergency</span>
        </button>
        <button
          type="button"
          className={tab === 'formulary' ? 'active' : ''}
          onClick={() => {
            setTab('formulary');
            setActiveMed(null);
          }}
        >
          <BookOpen size={18} />
          <span>Formulary</span>
        </button>
        <button
          type="button"
          className={tab === 'saved' ? 'active' : ''}
          onClick={() => {
            setTab('saved');
            setActiveMed(null);
          }}
        >
          <Star size={18} />
          <span>Saved</span>
        </button>
      </nav>
    </div>
  );
};
