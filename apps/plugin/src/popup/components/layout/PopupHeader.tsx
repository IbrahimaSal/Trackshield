interface PopupHeaderProps {
  url: string
}

export function PopupHeader({ url }: PopupHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #004D98, #A50044)' }}
        >
          <svg width="12" height="12" viewBox="0 0 19 19" fill="none">
            <path d="M9.5 2L3 5v5c0 3.5 2.8 6.8 6.5 7.8C13.2 16.8 16 13.5 16 10V5L9.5 2z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[13px] font-semibold">Trackshield</span>
      </div>
      <div className="font-mono text-[10px] text-white/40 bg-surface-2 px-2 py-1 rounded">
        {url}
      </div>
    </div>
  )
}
