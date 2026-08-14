'use client';

/* The chart of accounts — the master list every entry is filed under, and the
 * thing that makes any of the reports possible.
 *
 * It ships filled in, because an empty one is the exact problem this replaces:
 * a spreadsheet nobody can organise for want of names to organise it under.
 * Rename anything, add your own, retire what you do not use. Nothing is ever
 * deleted: entries already filed under a category have to keep their meaning
 * for as long as the books exist. */

import { useState } from 'react';
import {
  Category,
  FinanceKind,
  KINDS,
  KIND_HELP,
  addCategory,
  setCategoryArchived,
  setCurrency,
  updateCategory,
  useFinance,
} from '@/lib/finance';
import { Field, PageHead, cardStyle, inputStyle, labelStyle } from '@/components/finance/ui';
import { Button } from '@/components/ds';

export default function FinanceSetupPage() {
  const s = useFinance();

  const [name, setName] = useState('');
  const [kind, setKind] = useState<FinanceKind>('Operating expense');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [currencyDraft, setCurrencyDraft] = useState(s.currency);
  const [showRetired, setShowRetired] = useState(false);

  async function create() {
    setFormError('');
    if (!name.trim()) {
      setFormError('Give the category a name.');
      return;
    }
    const result = await addCategory(name, kind, description);
    if (result === null) {
      setFormError(s.error || 'Could not add that category.');
      return;
    }
    setName('');
    setDescription('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Setup"
        blurb="The list of things money can be filed under, and the currency everything is shown in"
      />

      {/* ---------------- currency ---------------- */}
      <section style={cardStyle}>
        <span style={labelStyle}>CURRENCY</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 150 }}>
            <Field label="Code" help="shown in front of every amount" htmlFor="currency">
              <input
                id="currency"
                value={currencyDraft}
                maxLength={6}
                onChange={(e) => setCurrencyDraft(e.target.value.toUpperCase())}
                style={inputStyle}
              />
            </Field>
          </div>
          <Button
            size="sm"
            disabled={s.busy || currencyDraft.trim() === s.currency}
            onClick={() => void setCurrency(currencyDraft)}
          >
            Save
          </Button>
          <span style={{ fontSize: 12, color: '#2C3A5E', flex: 1, minWidth: 200 }}>
            Everything is kept in one currency. Amounts already recorded are not converted — the
            code in front of them just changes.
          </span>
        </div>
      </section>

      {/* ---------------- add a category ---------------- */}
      <section style={{ ...cardStyle, borderTop: '4px solid #0F52BA' }}>
        <span style={labelStyle}>ADD A CATEGORY</span>
        <div className="fn-fin-form">
          <Field label="Name" htmlFor="c-name">
            <input
              id="c-name"
              placeholder="Pitch maintenance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Kind" help="this decides how it is counted" htmlFor="c-kind">
            <select
              id="c-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as FinanceKind)}
              style={inputStyle}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k} ({KIND_HELP[k]})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" help="the plain-English note shown in brackets" htmlFor="c-desc" wide>
            <input
              id="c-desc"
              placeholder="keeping the grass playable"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void create();
              }}
              style={inputStyle}
            />
          </Field>
        </div>

        {formError && (
          <span role="alert" style={{ fontSize: 12.5, color: '#C1443D', fontWeight: 600 }}>
            {formError}
          </span>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" disabled={s.busy} onClick={() => void create()}>
            {s.busy ? 'Adding…' : 'Add category'}
          </Button>
        </div>
      </section>

      {/* ---------------- the chart of accounts ---------------- */}
      {KINDS.map((k) => {
        const rows = s.categories.filter((c) => c.kind === k && (showRetired || !c.archived));
        return (
          <section key={k} style={{ ...cardStyle, padding: 0, gap: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #DDE6F3',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
                {k}{' '}
                <span style={{ fontWeight: 400, fontSize: 13, color: '#2C3A5E' }}>
                  ({KIND_HELP[k]})
                </span>
              </h2>
              <span style={labelStyle}>{rows.length} CATEGORIES</span>
            </div>

            {rows.map((c) => (
              <CategoryRow key={c.id} category={c} busy={s.busy} />
            ))}
          </section>
        );
      })}

      <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={showRetired}
          onChange={(e) => setShowRetired(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        Show retired categories{' '}
        <span style={{ color: '#2C3A5E' }}>(hidden from the entry form, but their history stays)</span>
      </label>
    </div>
  );
}

function CategoryRow({ category, busy }: { category: Category; busy: boolean }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        borderBottom: '1px solid #DDE6F3',
        flexWrap: 'wrap',
        opacity: category.archived ? 0.55 : 1,
      }}
    >
      <input
        aria-label="Category name"
        value={name}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (!name.trim()) {
            setName(category.name);
            return;
          }
          if (name.trim() !== category.name) void updateCategory(category.id, { name: name.trim() });
        }}
        style={{ ...inputStyle, width: 'auto', flex: '1 1 170px', fontWeight: 600 }}
      />
      <input
        aria-label="Description"
        placeholder="what this means, in plain words"
        value={description}
        disabled={busy}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => {
          if (description.trim() !== category.description) {
            void updateCategory(category.id, { description: description.trim() });
          }
        }}
        style={{ ...inputStyle, width: 'auto', flex: '2 1 230px', color: '#2C3A5E' }}
      />
      <button
        type="button"
        className="fn-reset-button"
        disabled={busy}
        onClick={() => void setCategoryArchived(category.id, !category.archived)}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: category.archived ? '#0F52BA' : '#C1443D',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {category.archived ? 'Bring back' : 'Retire'}
      </button>
    </div>
  );
}
