import React, { useState, useEffect } from 'react'
import RoomCard from '../../components/RoomCard'
import EmptyState from '../../components/EmptyState'
import { getFreeRooms } from '../../api'
import SearchIcon from '@mui/icons-material/Search'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AutorenewIcon from '@mui/icons-material/Autorenew'

const BLOCKS = [
  { id: '',           label: 'All Blocks' },
  { id: 'A',          label: 'Block A' },
  { id: 'B',          label: 'Block B' },
  { id: 'Techlounge', label: 'Techlounge' },
  { id: 'Ideafactory', label: 'Ideafactory' },
]

export default function FreeRoomFinder() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('1')
  const [block, setBlock] = useState('')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFreeRooms()
  }, [date, time, block])

  const fetchFreeRooms = async () => {
    setLoading(true)
    try {
      const res = await getFreeRooms({ date, time, block })
      setRooms(res.freeRooms || [])
    } catch (err) {
      console.error(err)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Free Room Finder</h1>
        <p className="text-xs text-textMuted dark:text-darkTextMuted">Search for unallocated classrooms and labs in real-time</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Period Slot</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
          >
            {[1, 2, 3, 4, 5, 6].map(p => (
              <option key={p} value={p} className="dark:bg-darkSurface">Period {p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Building Block</label>
          <select
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
          >
            {BLOCKS.map(b => (
              <option key={b.id} value={b.id} className="dark:bg-darkSurface">{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Finding available rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<MeetingRoomIcon style={{ fontSize: 40 }} />}
          title="No free rooms found"
          description="All rooms matching your criteria are currently occupied or unavailable."
        />
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-textMuted dark:text-darkTextMuted font-medium">
            Found <span className="text-primary dark:text-primaryLight font-bold">{rooms.length}</span> available rooms for Period {time}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
