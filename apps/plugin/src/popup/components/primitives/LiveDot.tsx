export function LiveDot(): JSX.Element {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-ok opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-severity-ok" />
    </span>
  )
}
