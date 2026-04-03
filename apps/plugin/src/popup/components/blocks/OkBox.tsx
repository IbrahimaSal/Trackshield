export function OkBox(): JSX.Element {
  return (
    <div
      className="rounded-lg p-3 text-center mb-3"
      style={{
        background: 'rgba(31,204,122,0.10)',
        border: '1px solid rgba(31,204,122,0.20)',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ display: 'block', margin: '0 auto 6px' }}
      >
        <path
          d="M4 10l4 4 8-8"
          stroke="#1FCC7A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-xs font-medium text-severity-ok">
        Ce site respecte votre vie privée
      </div>
    </div>
  )
}
