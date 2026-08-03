'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} 

from 'react';
import './purchase.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

interface Student {
  _id: string;
  user: User;
  age: number;
  gender: string;
}

interface Package {
  _id: string;
  price: number;
  numberOfMonths: number;
  numberOfSessions: number;
}

interface ProofVerification {
  status: string;
  verifiedAt: string | null;
  notes: string;
}

interface ProofAnalysis {
  detectedAmount: number;
  sender: string;
  receiver: string;
  confidence: number;
  extractedText: string;
}

interface Purchase {
  _id: string;
  proofAnalysis: ProofAnalysis;
  proofVerification: ProofVerification;
  paymentProof?: string;
  student: Student;
  package: Package;
  requiredAmount: number;
  paidAmount: number;
  totalSessions: number;
  consumedSessions: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type FilterKey = 'all' | 'paid' | 'unpaid';

// ─── Constants ────────────────────────────────────────────────────────────────

// const API_BASE = 'http://localhost:4000/api';
const API_BASE = 'https://code-minds-website.vercel.app/api';

// Change this key if your localStorage uses a different name
const TOKEN_KEY = 'token';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'All'      },
  { key: 'paid',    label: 'Paid'     },
  { key: 'unpaid',  label: 'Unpaid'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip Unicode directional marks that can appear in Arabic/bidi names */
const cleanName = (raw: string) =>
  raw.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').trim();

/** First printable character for avatars */
const initials = (raw: string) => {
  const clean = cleanName(raw);
  return (clean[0] ?? '?').toUpperCase();
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const paymentPct = (p: Purchase) =>
  p.requiredAmount > 0
    ? Math.min(Math.round((p.paidAmount / p.requiredAmount) * 100), 100)
    : 0;

const getToken = () =>
  (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null) ?? '';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<string, { cls: string; label: string }> = {
  pending:  { cls: 'badge--pending',  label: 'Pending'  },
  paid:     { cls: 'badge--paid',     label: 'Paid'     },
  verified: { cls: 'badge--verified', label: 'Verified' },
  rejected: { cls: 'badge--rejected', label: 'Rejected' },
};

const badgeMeta = (status: string) =>
  STATUS_META[status.toLowerCase()] ?? { cls: 'badge--default', label: status };

// ─── SVG Icons (inline, no extra deps) ───────────────────────────────────────

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
);

const IconDropzone = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

// ─── Purchase Card ────────────────────────────────────────────────────────────

interface CardProps {
  purchase: Purchase;
  onUpload: (p: Purchase) => void;
  onView: (p: Purchase) => void;
}

function PurchaseCard({ purchase: p, onUpload, onView }: CardProps) {
  const pct = paymentPct(p);
  const statusInfo = badgeMeta(p.status);
  const proofInfo  = badgeMeta(p.proofVerification.status);
  const name       = cleanName(p.student.user.name);

  return (
    <article className="pc-card">
      {/* ── Identity row ── */}
      <div className="pc-card__head">
        <div className="pc-avatar" aria-hidden="true">
          {initials(p.student.user.name)}
        </div>

        <div className="pc-identity">
          <h3 className="pc-identity__name" title={name}>{name}</h3>
          <p className="pc-identity__line">{p.student.user.email}</p>
          <p className="pc-identity__line pc-identity__phone">{p.student.user.phone}</p>
        </div>

        <div className="pc-badges">
          <span className={`pc-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
          {p.proofVerification.status !== 'pending' && p.proofVerification.status !== p.status && (
            <span className={`pc-badge ${proofInfo.cls} pc-badge--outline`}>{proofInfo.label}</span>
          )}
        </div>
      </div>

      {/* ── Amounts ── */}
      <div className="pc-amounts">
        <div className="pc-amount-cell">
          <span className="pc-amount-cell__label">Required</span>
          <span className="pc-amount-cell__value">
            EGP <strong>{p.requiredAmount.toLocaleString()}</strong>
          </span>
        </div>
        <div className="pc-amount-divider" aria-hidden="true">›</div>
        <div className="pc-amount-cell">
          <span className="pc-amount-cell__label">Paid</span>
          <span className={`pc-amount-cell__value ${p.paidAmount > 0 ? 'pc-amount-cell__value--paid' : 'pc-amount-cell__value--zero'}`}>
            EGP <strong>{p.paidAmount.toLocaleString()}</strong>
          </span>
        </div>
        <div className="pc-amount-divider" aria-hidden="true">·</div>
        <div className="pc-amount-cell">
          <span className="pc-amount-cell__label">Sessions</span>
          <span className="pc-amount-cell__value">
            <strong>{p.consumedSessions}</strong>/{p.totalSessions}
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="pc-progress">
        <div className="pc-progress__meta">
          <span>Payment progress</span>
          <span className={pct === 100 ? 'pc-progress__pct--full' : ''}>{pct}%</span>
        </div>
        <div className="pc-progress__track" role="progressbar"
          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="pc-progress__fill" style={{ width: `${pct}%` }}
            data-full={pct === 100 ? 'true' : undefined} />
        </div>
      </div>

      {/* ── Package tag + footer ── */}
      <div className="pc-card__foot">
        <div className="pc-meta-row">
          <span className="pc-package-tag">
            {p.package.numberOfMonths}mo · {p.package.numberOfSessions} sessions
          </span>
          <span className="pc-date">
            <IconCalendar />{formatDate(p.createdAt)}
          </span>
        </div>

        <div className="pc-actions">
          <button className="pc-view-btn" onClick={() => onView(p)}>
            <IconEye /> View
          </button>
          <button className="pc-upload-btn" onClick={() => onUpload(p)}>
            <IconUpload /> Upload Proof
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  purchase: Purchase;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ purchase, onClose, onSuccess }: UploadModalProps) {
  const [paidAmount, setPaidAmount] = useState('');
  const [proofFile, setProofFile]   = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [result, setResult]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [dragOver, setDragOver]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Cleanup object URL
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    setProofFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!proofFile || !paidAmount) return;

    setUploading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('purchaseId', purchase._id);
      fd.append('paidAmount', paidAmount);
      fd.append('proofImage', proofFile);

      const res = await fetch(`${API_BASE}/purchases/uploadPaymentProof/admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      const ok   = json.success ?? res.ok;
      setResult({ ok, msg: json.message || (ok ? 'Uploaded successfully' : 'Upload failed') });

      if (ok) {
        onSuccess();
        setTimeout(onClose, 1800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setResult({ ok: false, msg });
    } finally {
      setUploading(false);
    }
  };

  const name = cleanName(purchase.student.user.name);
  const canSubmit = !!proofFile && !!paidAmount && !uploading;

  return (
    <div className="pm-overlay" onClick={onClose} role="dialog" aria-modal="true"
      aria-label="Upload Payment Proof">
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-modal__head">
          <h2>Upload Payment Proof</h2>
          <button className="pm-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="pm-modal__body">
          {/* Student summary card */}
          <div className="pm-summary">
            <div className="pc-avatar pc-avatar--md" aria-hidden="true">
              {initials(purchase.student.user.name)}
            </div>
            <div className="pm-summary__info">
              <strong title={name}>{name}</strong>
              <span>{purchase.student.user.phone}</span>
              <span className="pm-summary__email">{purchase.student.user.email}</span>
            </div>
            <div className="pm-summary__amount">
              <span>Required</span>
              <strong>EGP {purchase.requiredAmount.toLocaleString()}</strong>
            </div>
          </div>

          {/* Success state */}
          {result?.ok ? (
            <div className="pm-success">
              <div className="pm-success__icon">✓</div>
              <p>{result.msg}</p>
            </div>
          ) : (
            <>
              {/* Amount field */}
              <div className="pm-field">
                <label htmlFor="pm-amount">Paid Amount (EGP)</label>
                <input
                  id="pm-amount"
                  type="number"
                  className="pm-input"
                  placeholder={`Enter amount (max ${purchase.requiredAmount.toLocaleString()})`}
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  min="1"
                  max={purchase.requiredAmount}
                />
              </div>

              {/* Dropzone */}
              <div className="pm-field">
                <label>Proof Image</label>
                <div
                  className={`pm-dropzone ${dragOver ? 'pm-dropzone--drag' : ''} ${previewUrl ? 'pm-dropzone--preview' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload proof image"
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="pm-preview-wrap">
                      <img src={previewUrl} alt="Proof preview" className="pm-preview" />
                      <span className="pm-preview__hint">Click to replace</span>
                    </div>
                  ) : (
                    <div className="pm-dropzone__idle">
                      <IconDropzone />
                      <p>Click or drag &amp; drop</p>
                      <span>PNG, JPG, JPEG up to 10 MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Error */}
              {result && !result.ok && (
                <div className="pm-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {result.msg}
                </div>
              )}

              {/* Actions */}
              <div className="pm-actions">
                <button className="pm-btn pm-btn--ghost" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="pm-btn pm-btn--primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {uploading ? (
                    <><span className="pm-spinner" aria-hidden="true" /> Uploading…</>
                  ) : (
                    <><IconUpload /> Submit Proof</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Proof Detail Modal ───────────────────────────────────────────────────────

interface ProofDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
}

function ProofDetailModal({ purchase: p, onClose }: ProofDetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const v = p.proofVerification;
  const a = p.proofAnalysis;
  const vInfo = badgeMeta(v.status);
  const name = cleanName(p.student.user.name);

  return (
    <div className="pm-overlay" onClick={onClose} role="dialog" aria-modal="true"
      aria-label="Proof Details">
      <div className="pm-modal pd-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-modal__head">
          <h2>Payment Proof Details</h2>
          <button className="pm-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="pm-modal__body">

          {/* Student summary */}
          <div className="pm-summary">
            <div className="pc-avatar pc-avatar--md" aria-hidden="true">
              {initials(p.student.user.name)}
            </div>
            <div className="pm-summary__info">
              <strong title={name}>{name}</strong>
              <span>{p.student.user.phone}</span>
              <span className="pm-summary__email">{p.student.user.email}</span>
            </div>
            <div className="pm-summary__amount">
              <span>Required</span>
              <strong>EGP {p.requiredAmount.toLocaleString()}</strong>
            </div>
          </div>

          {/* Proof image */}
          <div className="pm-field">
            <label>Proof Image</label>
            {p.paymentProof ? (
              <a
                href={p.paymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="pd-image-link"
              >
                <img src={p.paymentProof} alt="Payment proof" className="pd-image" />
              </a>
            ) : (
              <div className="pd-no-image">No proof image uploaded</div>
            )}
          </div>

          {/* Verification info */}
          <div className="pd-section">
            <h3 className="pd-section__title">Verification</h3>
            <div className="pd-grid">
              <div className="pd-row">
                <span className="pd-row__label">Status</span>
                <span className={`pc-badge ${vInfo.cls}`}>{vInfo.label}</span>
              </div>
              <div className="pd-row">
                <span className="pd-row__label">Verified At</span>
                <span className="pd-row__value">
                  {v.verifiedAt ? formatDate(v.verifiedAt) : '—'}
                </span>
              </div>
              <div className="pd-row pd-row--full">
                <span className="pd-row__label">Notes</span>
                <span className="pd-row__value">{v.notes || '—'}</span>
              </div>
            </div>
          </div>

          {/* AI Analysis info */}
          <div className="pd-section">
            <h3 className="pd-section__title">Proof Analysis</h3>
            <div className="pd-grid">
              <div className="pd-row">
                <span className="pd-row__label">Detected Amount</span>
                <span className="pd-row__value">
                  {a.detectedAmount ? `EGP ${a.detectedAmount.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="pd-row">
                <span className="pd-row__label">Confidence</span>
                <span className="pd-row__value">
                  {a.confidence ? `${Math.round(a.confidence * 100)}%` : '—'}
                </span>
              </div>
              <div className="pd-row">
                <span className="pd-row__label">Sender</span>
                <span className="pd-row__value">{a.sender || '—'}</span>
              </div>
              <div className="pd-row">
                <span className="pd-row__label">Receiver</span>
                <span className="pd-row__value">{a.receiver || '—'}</span>
              </div>
              <div className="pd-row pd-row--full">
                <span className="pd-row__label">Extracted Text</span>
                <span className="pd-row__value pd-row__value--mono">
                  {a.extractedText || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pm-actions">
            <button className="pm-btn pm-btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [query,     setQuery]     = useState('');
  const [filter,    setFilter]    = useState<FilterKey>('all');
  const [modal,     setModal]     = useState<Purchase | null>(null);
  const [viewModal, setViewModal] = useState<Purchase | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setPurchases(json.data ?? []);
      } else {
        throw new Error(json.message || 'Failed to load');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = purchases.filter(p => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      cleanName(p.student.user.name).toLowerCase().includes(q) ||
      p.student.user.phone.includes(q) ||
      p.student.user.email.toLowerCase().includes(q);

    const matchFilter =
      filter === 'all'      ||
      (filter === 'paid'     && p.status === 'paid')     ||
      (filter === 'unpaid'   && p.paidAmount < p.requiredAmount);

    return matchSearch && matchFilter;
  });

  const counts: Record<FilterKey, number> = {
    all:      purchases.length,
    paid:     purchases.filter(p => p.status === 'paid').length,
    unpaid:   purchases.filter(p => p.paidAmount < p.requiredAmount).length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pp-root">

      {/* ── Header ── */}
      <header className="pp-header">
        <div>
          <h1 className="pp-header__title">Purchases</h1>
          <p className="pp-header__sub">Manage and verify student payment records</p>
        </div>
        <button
          className={`pp-refresh ${loading ? 'pp-refresh--spinning' : ''}`}
          onClick={fetchPurchases}
          disabled={loading}
          aria-label="Refresh purchases"
        >
          <IconRefresh /> Refresh
        </button>
      </header>

      {/* ── Search ── */}
      <div className="pp-search">
        <span className="pp-search__icon"><IconSearch /></span>
        <input
          type="search"
          className="pp-search__input"
          placeholder="Search by name, phone, or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search purchases"
        />
        {query && (
          <button className="pp-search__clear" onClick={() => setQuery('')} aria-label="Clear search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <nav className="pp-tabs" aria-label="Filter purchases">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`pp-tab ${filter === key ? 'pp-tab--active' : ''}`}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
          >
            {label}
            <span className="pp-tab__count">{counts[key]}</span>
          </button>
        ))}
      </nav>

      {/* ── Main content ── */}
      <main className="pp-main">
        {loading ? (
          <div className="pp-state" role="status" aria-live="polite">
            <div className="pp-spinner--lg" aria-hidden="true" />
            <p>Loading purchases…</p>
          </div>

        ) : error ? (
          <div className="pp-state pp-state--error" role="alert">
            <div className="pp-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>{error}</p>
            <button className="pp-retry" onClick={fetchPurchases}>Try Again</button>
          </div>

        ) : filtered.length === 0 ? (
          <div className="pp-state">
            <div className="pp-state__icon pp-state__icon--empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <line x1="9" y1="10" x2="15" y2="10"/>
              </svg>
            </div>
            <p>No purchases found</p>
            {query && <span className="pp-state__sub">Try a different search term</span>}
          </div>

        ) : (
          <>
            <p className="pp-result-count" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'purchase' : 'purchases'}
            </p>
            <div className="pp-grid">
              {filtered.map(p => (
                <PurchaseCard
                  key={p._id}
                  purchase={p}
                  onUpload={setModal}
                  onView={setViewModal}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Upload modal ── */}
      {modal && (
        <UploadModal
          purchase={modal}
          onClose={() => setModal(null)}
          onSuccess={fetchPurchases}
        />
      )}

      {/* ── Proof detail modal ── */}
      {viewModal && (
        <ProofDetailModal
          purchase={viewModal}
          onClose={() => setViewModal(null)}
        />
      )}
    </div>
  );
}