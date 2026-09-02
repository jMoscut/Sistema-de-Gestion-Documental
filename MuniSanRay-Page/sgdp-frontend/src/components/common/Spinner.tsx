interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ size = 'md' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4 border-primary-200 border-t-primary`}
    />
  )
}
