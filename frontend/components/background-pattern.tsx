export function BackgroundPattern() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: "url('/images/bg-pattern.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px',
        opacity: 1,
      }}
    />
  )
}
