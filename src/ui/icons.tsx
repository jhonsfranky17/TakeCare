import type { SVGProps } from 'react';

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function Stroke({ size = 22, paths, strokeW = 2.2, ...rest }: IconProps & { paths: string[]; strokeW?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...rest}>
      {paths.map((path) => (
        <path
          key={path} d={path} stroke="currentColor" strokeWidth={strokeW}
          strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => <Stroke {...p} paths={['M5 12.6l4.2 4.2L19 7']} strokeW={2.6} />;
export const ClockIcon = (p: IconProps) => <Stroke {...p} paths={['M12 7.4V12l3 1.8', 'M12 21a9 9 0 100-18 9 9 0 000 18']} />;
export const HomeIcon = (p: IconProps) => <Stroke {...p} paths={['M4 10.6L12 4l8 6.6V20h-5v-5.4H9V20H4v-9.4z']} />;
export const PillIcon = (p: IconProps) => <Stroke {...p} paths={['M14.8 4.6a4.6 4.6 0 016.6 6.5l-9.9 9.9A4.6 4.6 0 012.9 14.5l9.9-9.9z', 'M8.4 8.9l6.7 6.7']} />;
export const FamilyIcon = (p: IconProps) => (
  <Stroke
    {...p}
    paths={[
      'M8.6 11.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8z',
      'M2.6 19.4c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4',
      'M16.4 6.2a3 3 0 010 5.6',
      'M18 14.4c2 .6 3.4 2.3 3.4 4.6',
    ]}
  />
);
export const InfoIcon = ({ size = 20, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...rest}>
    <circle cx={12} cy={12} r={9.5} stroke="currentColor" strokeWidth={1.8} />
    <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={12} cy={16.6} r={1.2} fill="currentColor" />
  </svg>
);
