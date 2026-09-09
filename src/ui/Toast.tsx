export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      style={{
        position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 30,
        background: 'var(--lima-950)', color: 'var(--lima-100)',
        borderRadius: 18, padding: '15px 17px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 10px 26px rgba(29, 50, 1, 0.3)',
        animation: 'tc-rise 0.3s ease both',
      }}
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }} aria-hidden>
        <circle cx={12} cy={12} r={10.5} fill="var(--lima-400)" />
        <path
          d="M7 12.4l3.4 3.4L17 9" stroke="var(--lima-950)" strokeWidth={2.4}
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{message}</div>
    </div>
  );
}
