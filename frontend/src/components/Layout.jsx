import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatWidget from './ChatWidget'

export default function Layout({ role }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bgApp dark:bg-darkBgApp text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  )
}
