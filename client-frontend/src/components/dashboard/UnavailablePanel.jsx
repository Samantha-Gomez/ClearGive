import { CircleHelp } from 'lucide-react'

export default function UnavailablePanel({ children }) {
  return <div className="unavailable-panel"><CircleHelp size={18} /><span>{children}</span></div>
}