const VARIANTS = {
  PENDING:  'bg-amber-100  text-amber-700  border-amber-200',
  APPROVED: 'bg-green-100  text-green-700  border-green-200',
  REJECTED: 'bg-red-100    text-red-700    border-red-200',
  theory:   'bg-purple-100 text-purple-700 border-purple-200',
  lab:      'bg-blue-100   text-blue-700   border-blue-200',
}

export default function StatusBadge({ status }) {
  const s = String(status).toUpperCase()
  const cls = VARIANTS[s] || VARIANTS[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  )
}
