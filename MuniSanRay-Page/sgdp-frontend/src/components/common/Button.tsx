import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  className = '',
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary hover:bg-primary-600 text-white focus:ring-primary',
    secondary: 'bg-accent hover:bg-accent-600 text-gray-900 focus:ring-accent',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
