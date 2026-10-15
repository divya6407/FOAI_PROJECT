import React from 'react'

export default function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder shadow-sm p-4 flex items-center gap-4 transition-colors">
      <div className="p-3 rounded-2xl bg-surfaceAlt dark:bg-darkSurfaceAlt text-primary dark:text-primaryLight flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value ?? '—'}</div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</div>
        {sub && <div className="text-[10px] text-textMuted dark:text-darkTextMuted mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
