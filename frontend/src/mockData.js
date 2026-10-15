// mockData.js — dev fallback data matching backend shapes

export const mockStats = {
  date: new Date().toISOString().split('T')[0],
  classes: 24,
  events: 2,
  freeRooms: 47,
  pendingRequests: 3,
  conflicts: 0,
}

export const mockTimetableEntries = [
  { batchId: 'batch_sub_wp_A', batchName: 'WP-A', subjectId: 'sub_wp', subjectName: 'Web Programming', teacherId: 't_sub_wp_1', teacherName: 'Dr. Meera Pillai', roomId: 'A203', day: 'Mon', period: 1, sessionType: 'lab',    isEvent: false },
  { batchId: 'batch_sub_cn_B', batchName: 'CN-B', subjectId: 'sub_cn', subjectName: 'Computer Networks',  teacherId: 't_sub_cn_1', teacherName: 'Dr. Kavitha Reddy', roomId: 'B101', day: 'Mon', period: 2, sessionType: 'theory', isEvent: false },
  { batchId: 'batch_sub_toc_A', batchName: 'TC-A', subjectId: 'sub_toc', subjectName: 'Theory of Computation', teacherId: 't_sub_toc_1', teacherName: 'Dr. Ananya Sharma', roomId: 'A105', day: 'Mon', period: 3, sessionType: 'theory', isEvent: false },
  { batchId: 'batch_sub_foai_A', batchName: 'AI-A', subjectId: 'sub_foai', subjectName: 'Foundation of AI',  teacherId: 't_sub_foai_1', teacherName: 'Dr. Deepa Krishnamurthy', roomId: 'A204', day: 'Tue', period: 1, sessionType: 'lab',    isEvent: false },
  { batchId: 'batch_sub_mc_A', batchName: 'MC-A', subjectId: 'sub_mc', subjectName: 'Mobile Computing', teacherId: 't_sub_mc_1', teacherName: 'Dr. Sunita Iyer', roomId: 'B205', day: 'Tue', period: 4, sessionType: 'theory', isEvent: false },
]

export const mockRooms = [
  { id: 'A101', block: 'A', roomType: 'classroom', capacity: 200, hasEboard: true },
  { id: 'A203', block: 'A', roomType: 'lab',       capacity: 120, hasEboard: true },
  { id: 'TL1',  block: 'Techlounge', roomType: 'lab', capacity: 35, hasEboard: false },
  { id: 'IF3',  block: 'Ideafactory', roomType: 'lab', capacity: 33, hasEboard: true },
]

export const mockEventRequests = [
  {
    id: 'evt_001',
    title: 'National Symposium on AI & Society',
    requestedBy: 'Dr. Deepa Krishnamurthy',
    date: '2026-09-30',
    startPeriod: 1, endPeriod: 6,
    expectedParticipants: 180,
    block: 'A',
    requiresLab: false,
    requiresEboard: true,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt_002',
    title: 'Hands-On Workshop: Full-Stack Web Development',
    requestedBy: 'Prof. Arun Desai',
    date: '2026-10-03',
    startPeriod: 2, endPeriod: 4,
    expectedParticipants: 55,
    block: 'Techlounge',
    requiresLab: true,
    requiresEboard: true,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt_000',
    title: 'Orientation: Cloud Computing Bootcamp',
    requestedBy: 'Prof. Naveen Joshi',
    date: '2026-09-28',
    startPeriod: 1, endPeriod: 2,
    expectedParticipants: 60,
    block: 'A',
    requiresLab: false,
    requiresEboard: true,
    status: 'APPROVED',
    assignedRoomId: 'A201',
    createdAt: new Date().toISOString(),
  },
]
