import StatusBadge from './StatusBadge'

export default function RoomCard({ room }) {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder shadow-sm p-4 flex flex-col gap-2 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{room.id}</span>
        <StatusBadge status={room.roomType} />
      </div>
      <div className="text-xs text-textMuted dark:text-darkTextMuted">
        Block: <span className="font-semibold text-gray-700 dark:text-gray-200">{room.block}</span>
      </div>
      <div className="text-xs text-textMuted dark:text-darkTextMuted">
        Capacity: <span className="font-semibold text-gray-700 dark:text-gray-200">{room.capacity} seats</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`inline-block w-2 h-2 rounded-full ${room.hasEboard ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
        <span className="text-textMuted dark:text-darkTextMuted">{room.hasEboard ? 'Smart E-board' : 'Standard Board'}</span>
      </div>
    </div>
  )
}
