interface CompanyAvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md'
}

export function CompanyAvatar({ initials, color, size = 'md' }: CompanyAvatarProps): JSX.Element {
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-[10px]'
  return (
    <div
      className={`${sizeClass} rounded-md flex items-center justify-center font-semibold flex-shrink-0`}
      style={{
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      {initials}
    </div>
  )
}
