import React from 'react'
import InboxIcon from '@mui/icons-material/Inbox'

export default function EmptyState({
  icon = <InboxIcon style={{ fontSize: 40 }} />,
  title = "No data found",
  description = "There are no records to display at this time."
}) {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-8 text-center flex flex-col items-center justify-center my-4 space-y-2 shadow-sm transition-colors">
      <div className="p-3 rounded-2xl bg-surfaceAlt dark:bg-darkSurfaceAlt text-textMuted dark:text-darkTextMuted flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-textMuted dark:text-darkTextMuted max-w-sm">{description}</p>
    </div>
  )
}
