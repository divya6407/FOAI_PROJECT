import React from 'react'

export default function MonthGrid({ days = {}, month }) {
  const entries = Object.entries(days)
  if (!entries.length) return <p className="text-textMuted dark:text-darkTextMuted text-xs">No data available.</p>

  const firstDate  = entries[0][0]
  const firstDay   = new Date(firstDate).getDay()
  const startOffset = firstDay

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-textMuted dark:text-darkTextMuted py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`sp-${i}`} />
        ))}
        {entries.map(([dateStr, info]) => {
          const dayNum = parseInt(dateStr.split('-')[2])
          const hasActivity = info.classes > 0 || info.events > 0
          return (
            <div
              key={dateStr}
              className={`rounded-xl p-1.5 min-h-[56px] border text-xs flex flex-col justify-between transition-colors ${
                info.isWeekend
                  ? 'bg-gray-50 dark:bg-darkSurfaceAlt/30 border-gray-100 dark:border-darkBorder text-gray-400 dark:text-gray-600'
                  : hasActivity
                    ? 'bg-surfaceAlt dark:bg-darkSurfaceAlt border-border dark:border-darkBorder'
                    : 'bg-white dark:bg-darkSurface border-border dark:border-darkBorder'
              }`}
            >
              <span className={`font-semibold ${info.isWeekend ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                {dayNum}
              </span>
              {!info.isWeekend && (
                <div className="space-y-0.5 text-[10px]">
                  {info.classes > 0 && (
                    <span className="block text-primary dark:text-primaryLight font-medium">{info.classes} cls</span>
                  )}
                  {info.events > 0 && (
                    <span className="block text-emerald-600 dark:text-emerald-400 font-medium">{info.events} evt</span>
                  )}
                  {!hasActivity && (
                    <span className="block text-gray-300 dark:text-gray-600">—</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
