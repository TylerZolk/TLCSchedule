'use client';

import { useState } from 'react';
import { ComplianceWarning, Users } from '@/types';
import { LaborSummary } from '@/lib/constants';

const SEVERITY_STYLES: Record<ComplianceWarning['severity'], { bg: string; text: string; dot: string }> = {
  error:   { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  warning: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  info:    { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
};

const TYPE_LABELS: Record<ComplianceWarning['type'], string> = {
  'overtime':             'Overtime',
  'short-rest':           'Short Rest',
  'long-shift':           'Long Shift',
  'minor-violation':      'Minor',
  'changed-after-publish':'Schedule Change',
};

interface Props {
  warnings: ComplianceWarning[];
  labor: LaborSummary;
  users: Users;
}

export default function CompliancePanel({ warnings, labor, users }: Props) {
  const [open, setOpen] = useState(true);

  const errors   = warnings.filter((w) => w.severity === 'error');
  const warnings_ = warnings.filter((w) => w.severity === 'warning');
  const infos    = warnings.filter((w) => w.severity === 'info');

  const headerColor = errors.length   ? 'border-red-200 bg-red-50'
    : warnings_.length ? 'border-amber-200 bg-amber-50'
    : warnings.length  ? 'border-blue-100 bg-blue-50'
    : 'border-black/8 bg-gray-50';

  const headerText = errors.length   ? 'text-red-700'
    : warnings_.length ? 'text-amber-700'
    : 'text-gray-600';

  const badge = errors.length + warnings_.length;

  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-3 border-b ${open ? headerColor : 'bg-gray-50 border-black/8'} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${open ? headerText : 'text-gray-700'}`}>
            Labor &amp; Compliance
          </span>
          {badge > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              errors.length ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-5 space-y-5">
          {/* Labor summary */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Labor</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Total hours', value: `${labor.totalHours}h` },
                { label: 'Total cost',  value: labor.totalCost > 0 ? `$${labor.totalCost.toFixed(0)}` : '—' },
                { label: 'Avg/hour',    value: labor.totalHours > 0 && labor.totalCost > 0
                    ? `$${(labor.totalCost / labor.totalHours).toFixed(2)}`
                    : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                  <p className="text-base font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {labor.byPosition.filter((p) => p.headcount > 0).length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/8">
                    <th className="text-left text-gray-400 font-medium pb-2">Position</th>
                    <th className="text-right text-gray-400 font-medium pb-2">Staff</th>
                    <th className="text-right text-gray-400 font-medium pb-2">Hours</th>
                    <th className="text-right text-gray-400 font-medium pb-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {labor.byPosition.filter((p) => p.headcount > 0).map((pos) => (
                    <tr key={pos.key} className="border-b border-black/[0.04] last:border-0">
                      <td className="py-2 font-medium text-gray-700">{pos.label}</td>
                      <td className="py-2 text-right text-gray-500">{pos.headcount}</td>
                      <td className="py-2 text-right text-gray-500">{pos.hours}h</td>
                      <td className="py-2 text-right font-medium text-gray-700">
                        {pos.cost > 0 ? `$${pos.cost.toFixed(0)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Warnings</p>
              <div className="space-y-1.5">
                {warnings.map((w, i) => {
                  const s = SEVERITY_STYLES[w.severity];
                  return (
                    <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${s.bg}`}>
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.text} mr-1.5`}>
                          {TYPE_LABELS[w.type]}
                        </span>
                        <span className={`text-xs ${s.text}`}>{w.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {warnings.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No compliance issues detected</p>
          )}
        </div>
      )}
    </div>
  );
}

