import React, { useState, useEffect } from 'react'
import { submitPreferences, getMyPreferences } from '../../api'
import { useAuth } from '../../context/AuthContext'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SettingsIcon from '@mui/icons-material/Settings'
import AutorenewIcon from '@mui/icons-material/Autorenew'

const SUBJECT_CONFIG = [
  {
    id: 'sub_lowcode',
    name: 'Low Code',
    teachers: [
      { id: 't_sub_lowcode_1', name: 'Dr. Priya Nair',       batches: [{ id: 'batch_sub_lowcode_A', label: 'Section A (LC-A)' }] },
      { id: 't_sub_lowcode_2', name: 'Prof. Karthik Menon',  batches: [{ id: 'batch_sub_lowcode_B', label: 'Section B (LC-B)' }] },
      { id: 't_sub_lowcode_3', name: 'Dr. Sanjay Verma',     batches: [{ id: 'batch_sub_lowcode_C', label: 'Section C (LC-C)' }] },
      { id: 't_sub_lowcode_4', name: 'Prof. Ritu Saxena',    batches: [{ id: 'batch_sub_lowcode_D', label: 'Section D (LC-D)' }] },
    ]
  },
  {
    id: 'sub_toc',
    name: 'Theory of Computation',
    teachers: [
      { id: 't_sub_toc_1', name: 'Dr. Ananya Sharma',        batches: [{ id: 'batch_sub_toc_A', label: 'Section A (TC-A)' }] },
      { id: 't_sub_toc_2', name: 'Prof. Rajesh Kumar',       batches: [{ id: 'batch_sub_toc_B', label: 'Section B (TC-B)' }] },
      { id: 't_sub_toc_3', name: 'Dr. Amit Shah',            batches: [{ id: 'batch_sub_toc_C', label: 'Section C (TC-C)' }] },
      { id: 't_sub_toc_4', name: 'Prof. Neha Gupta',         batches: [{ id: 'batch_sub_toc_D', label: 'Section D (TC-D)' }] },
    ]
  },
  {
    id: 'sub_mc',
    name: 'Mobile Computing',
    teachers: [
      { id: 't_sub_mc_1', name: 'Dr. Sunita Iyer',          batches: [{ id: 'batch_sub_mc_A', label: 'Section A (MC-A)' }] },
      { id: 't_sub_mc_2', name: 'Prof. Vikram Bhat',         batches: [{ id: 'batch_sub_mc_B', label: 'Section B (MC-B)' }] },
      { id: 't_sub_mc_3', name: 'Dr. Rahul Rao',            batches: [{ id: 'batch_sub_mc_C', label: 'Section C (MC-C)' }] },
      { id: 't_sub_mc_4', name: 'Prof. Pooja Hegde',         batches: [{ id: 'batch_sub_mc_D', label: 'Section D (MC-D)' }] },
    ]
  },
  {
    id: 'sub_wp',
    name: 'Web Programming',
    teachers: [
      { id: 't_sub_wp_1', name: 'Dr. Meera Pillai',         batches: [{ id: 'batch_sub_wp_A', label: 'Section A (WP-A)' }] },
      { id: 't_sub_wp_2', name: 'Prof. Arun Desai',          batches: [{ id: 'batch_sub_wp_B', label: 'Section B (WP-B)' }] },
      { id: 't_sub_wp_3', name: 'Dr. Siddharth Malhotra',    batches: [{ id: 'batch_sub_wp_C', label: 'Section C (WP-C)' }] },
      { id: 't_sub_wp_4', name: 'Prof. Swati Joshi',         batches: [{ id: 'batch_sub_wp_D', label: 'Section D (WP-D)' }] },
    ]
  },
  {
    id: 'sub_cn',
    name: 'Computer Networks',
    teachers: [
      { id: 't_sub_cn_1', name: 'Dr. Kavitha Reddy',        batches: [{ id: 'batch_sub_cn_A', label: 'Section A (CN-A)' }] },
      { id: 't_sub_cn_2', name: 'Prof. Suresh Nambiar',      batches: [{ id: 'batch_sub_cn_B', label: 'Section B (CN-B)' }] },
      { id: 't_sub_cn_3', name: 'Dr. Alok Tripathi',         batches: [{ id: 'batch_sub_cn_C', label: 'Section C (CN-C)' }] },
      { id: 't_sub_cn_4', name: 'Prof. Maya Fernandez',      batches: [{ id: 'batch_sub_cn_D', label: 'Section D (CN-D)' }] },
    ]
  },
  {
    id: 'sub_foai',
    name: 'Foundation of AI',
    teachers: [
      { id: 't_sub_foai_1', name: 'Dr. Deepa Krishnamurthy', batches: [{ id: 'batch_sub_foai_A', label: 'Section A (AI-A)' }] },
      { id: 't_sub_foai_2', name: 'Prof. Naveen Joshi',      batches: [{ id: 'batch_sub_foai_B', label: 'Section B (AI-B)' }] },
      { id: 't_sub_foai_3', name: 'Dr. Rohan Kulkarni',      batches: [{ id: 'batch_sub_foai_C', label: 'Section C (AI-C)' }] },
      { id: 't_sub_foai_4', name: 'Prof. Divya Menon',       batches: [{ id: 'batch_sub_foai_D', label: 'Section D (AI-D)' }] },
    ]
  },
]

export default function PreferenceForm() {
  const { user, setUser } = useAuth()
  const [selectedBatches, setSelectedBatches] = useState({})
  const [locked, setLocked] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const res = await getMyPreferences()
      setLocked(res.preferenceLocked)
      setSavedPrefs(res.preferences || {})

      const initial = {}
      SUBJECT_CONFIG.forEach(sub => {
        if (res.preferences && res.preferences[sub.id]) {
          initial[sub.id] = res.preferences[sub.id]
        } else {
          initial[sub.id] = sub.teachers[0].batches[0].id
        }
      })
      setSelectedBatches(initial)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSelect = (subjectId, batchId) => {
    if (locked) return
    setSelectedBatches(prev => ({ ...prev, [subjectId]: batchId }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (locked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await submitPreferences(selectedBatches)
      setLocked(true)
      setSavedPrefs(selectedBatches)
      setSuccess(true)
      if (user) {
        setUser({ ...user, preferenceLocked: true, preferences: selectedBatches })
      }
    } catch (err) {
      setError(err.message || 'Failed to lock preferences.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
        <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
        <p className="text-xs">Loading preference status...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Faculty & Section Preferences</h1>
        <p className="text-xs text-textMuted dark:text-darkTextMuted">Select your preferred instructor and section for each subject</p>
      </div>

      {locked ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
              <LockIcon />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Your Preferences Are Locked</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Your subject preference selections have been locked. Contact an administrator to reset your preference lock if changes are needed.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-darkSurface rounded-xl border border-amber-200 dark:border-amber-900 p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Locked Choices:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {SUBJECT_CONFIG.map(sub => {
                const bId = savedPrefs[sub.id]
                let label = bId
                sub.teachers.forEach(t => {
                  t.batches.forEach(b => {
                    if (b.id === bId) label = `${t.name} (${b.label})`
                  })
                })
                return (
                  <div key={sub.id} className="flex justify-between p-2 rounded-lg bg-surfaceAlt/50 dark:bg-darkSurfaceAlt/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{sub.name}:</span>
                    <span className="text-primary dark:text-primaryLight font-medium">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-6 shadow-sm space-y-6">
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircleIcon fontSize="small" />
              <span>Preferences saved and locked successfully! You can now view your personalized timetable.</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {SUBJECT_CONFIG.map(sub => (
              <div key={sub.id} className="p-4 rounded-xl bg-surfaceAlt/40 dark:bg-darkSurfaceAlt/40 border border-border/70 dark:border-darkBorder space-y-3">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{sub.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {sub.teachers.map(teacher => (
                    <div key={teacher.id} className="bg-white dark:bg-darkSurface p-3 rounded-lg border border-border dark:border-darkBorder space-y-2">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{teacher.name}</div>
                      <div className="space-y-1">
                        {teacher.batches.map(batch => (
                          <label key={batch.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="radio"
                              name={sub.id}
                              value={batch.id}
                              checked={selectedBatches[sub.id] === batch.id}
                              onChange={() => handleBatchSelect(sub.id, batch.id)}
                              className="accent-primary"
                            />
                            <span>{batch.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-textMuted dark:text-darkTextMuted">⚠️ Note: Preferences can only be submitted ONCE.</span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <LockIcon fontSize="small" />
              <span>{submitting ? 'Locking...' : 'Lock & Save Preferences'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
