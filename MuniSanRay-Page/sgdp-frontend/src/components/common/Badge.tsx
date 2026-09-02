interface Props {
  variant: 'active' | 'pending' | 'expired' | 'responded' | 'denied' | 'info'
  children: string
}

export default function Badge({ variant, children }: Props) {
  const styles = {
    active: 'bg-accent-100 text-accent-700',
    pending: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
    responded: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
