// Subtle watermark of the current points-table leader's logo behind the Home page — only
// once the tournament has actually started (leader has points on the board), and it updates
// automatically as the lead changes since it's driven straight off the live points table.
export function LeaderBackground({ team }) {
  if (!team) return null
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 'min(90vw, 640px)',
          aspectRatio: '1 / 1',
          marginTop: '8vh',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${team.color}33 0%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={team.logo}
          alt=""
          style={{
            width: '70%',
            objectFit: 'contain',
            opacity: 0.08,
            filter: 'grayscale(0.2)',
          }}
        />
      </div>
    </div>
  )
}
