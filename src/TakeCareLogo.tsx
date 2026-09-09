import type { SVGProps } from 'react';

/**
 * TakeCare mark — direction A, "pulse through the pill".
 * Inherits currentColor, so it themes with the surrounding text colour.
 * <TakeCareLogo size={32} />                        → mark only
 * <TakeCareLogo size={32} withWordmark />           → mark + wordmark
 */
export function TakeCareLogo({
  size = 32,
  withWordmark = false,
  ...rest
}: { size?: number; withWordmark?: boolean } & SVGProps<SVGSVGElement>) {
  const mark = (
    <>
      <rect
        x={7} y={18} width={34} height={16} rx={8}
        transform="rotate(-38 24 26)" fill="currentColor" opacity={0.2}
      />
      <path
        d="M6 24h7.5l4-9.5L24 32l4-9h10"
        fill="none" stroke="currentColor" strokeWidth={3.6}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </>
  );

  if (!withWordmark) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="TakeCare" {...rest}>
        {mark}
      </svg>
    );
  }

  return (
    <svg
      height={size} width={(size * 260) / 48} viewBox="0 0 260 48"
      role="img" aria-label="TakeCare" {...rest}
    >
      {mark}
      <text
        x={54} y={33} fontFamily="Poppins, system-ui, sans-serif"
        fontSize={30} fontWeight={700} letterSpacing={-1} fill="currentColor"
      >
        TakeCare
      </text>
    </svg>
  );
}
