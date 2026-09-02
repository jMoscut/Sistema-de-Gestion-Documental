import type { ReactNode } from 'react'

interface Props {
  type: 'error' | 'success' | 'warning' | 'info'
  children: ReactNode
}

export default function Alert({ type, children }: Props) {
  const styles = {
    error: 'bg-red-50 border-red-400 text-red-800',
    success: 'bg-green-50 border-green-400 text-green-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}
