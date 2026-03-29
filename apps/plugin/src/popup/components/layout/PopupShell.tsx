interface PopupShellProps {
  children: React.ReactNode
}

export function PopupShell({ children }: PopupShellProps): JSX.Element {
  return (
    <div className="w-[340px] min-h-[400px] bg-surface text-white flex flex-col">
      {children}
    </div>
  )
}
