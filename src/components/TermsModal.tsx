import React from 'react';

interface TermsModalProps {
  isReadOnly?: boolean;
  acceptedAt?: string | null;
  onAgree: () => void;
  onClose?: () => void;
}

const SECTIONS = [
  {
    num: '1.',
    title: 'Acceptance of Terms',
    body: 'By accessing or using PediaDose (the "Software"), you acknowledge that you have read, understood, and agree to be bound by this End-User Agreement, Medical Disclaimer, and Waiver of Liability.',
  },
  {
    num: '2.',
    title: 'Clinical Reference Aid Only (No Medical Advice)',
    body: 'PediaDose is designed strictly as an educational and clinical calculation reference aid for licensed healthcare professionals. It does not provide medical advice, diagnosis, or treatment recommendations. You remain solely responsible for all clinical decisions, prescriptions, and patient care.',
  },
  {
    num: '3.',
    title: 'Mandatory Independent Verification',
    body: 'Prior to ordering, dispensing, or administering any medication, you agree to independently verify: (a) the patient’s actual measured weight, age, and clinical status; (b) the exact concentration on the physical bottle or vial; (c) renal/hepatic adjustments, allergies, and interactions; and (d) institutional protocols.',
  },
  {
    num: '4.',
    title: 'Assumption of Risk & Waiver of Liability',
    body: 'You expressly agree that your use of the Software is at your sole risk. To the fullest extent permitted by law, you waive, release, and discharge CodeBlueMD / PediaDose and its developers from any claims or damages arising out of any clinical outcome, dosing error, or adverse event.',
  },
  {
    num: '5.',
    title: 'Disclaimer of Warranties ("AS IS")',
    body: 'The Software and formulary data are provided "AS IS" without warranties of any kind. Clinical guidelines evolve continuously and entries may not reflect the latest institutional updates.',
  },
  {
    num: '6.',
    title: 'Privacy & Local Storage',
    body: 'All weight/age inputs, bookmarks, and recent order history are stored locally in your browser. PediaDose does not transmit Protected Health Information (PHI) or personal data to external servers. Full policy: https://codebluemd.com/pediadose/privacy',
  },
];

export const TermsModal: React.FC<TermsModalProps> = ({
  isReadOnly = false,
  acceptedAt,
  onAgree,
  onClose,
}) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 id="terms-title" style={{ margin: 0, fontSize: '1.45rem' }}>
              Terms &amp; Conditions
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              End-User Agreement &amp; Waiver of Liability — CodeBlueMD / PediaDose
            </p>
          </div>
          {isReadOnly && onClose && (
            <button className="chip" onClick={onClose}>
              Close
            </button>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SECTIONS.map((s) => (
            <div key={s.num}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', marginBottom: 4 }}>
                {s.num} {s.title}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>

        {isReadOnly && acceptedAt && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 14 }}>
            Accepted on {new Date(acceptedAt).toLocaleString()}
          </p>
        )}

        {!isReadOnly && (
          <button className="agree-btn" onClick={onAgree}>
            I Agree
          </button>
        )}
      </div>
    </div>
  );
};
