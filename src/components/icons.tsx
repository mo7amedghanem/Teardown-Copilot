import type { SVGProps } from 'react';

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M4.5 12.75 9 17.25 19.5 6.75" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowUturnLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M7.5 15 3 10.5 7.5 6" />
      <path {...strokeProps} d="M3 10.5h9a4.5 4.5 0 1 1 0 9H9" />
    </svg>
  );
}

export function ArrowDownTrayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M12 3v12" />
      <path {...strokeProps} d="m7.5 11.25 4.5 4.5 4.5-4.5" />
      <path {...strokeProps} d="M4.5 19.5h15" />
    </svg>
  );
}

export function ArrowPathIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M16.5 7.5 21 3m0 0h-5.25M21 3v5.25" />
      <path {...strokeProps} d="M7.5 16.5 3 21m0 0h5.25M3 21v-5.25" />
      <path {...strokeProps} d="M4.5 9a7.5 7.5 0 0 1 14.25-3" />
      <path {...strokeProps} d="M19.5 15a7.5 7.5 0 0 1-14.25 3" />
    </svg>
  );
}

export function ArrowTopRightOnSquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M9 6h9v9" />
      <path {...strokeProps} d="M15 9 5.25 18.75" />
      <path {...strokeProps} d="M5.25 18.75H15" />
      <path {...strokeProps} d="M5.25 18.75V9.75" />
    </svg>
  );
}

export function DocumentDuplicateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M8.25 4.5H15l3 3v12.75a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V4.5z" />
      <path {...strokeProps} d="M6 7.5H4.5a.75.75 0 0 0-.75.75v12a.75.75 0 0 0 .75.75h9" />
    </svg>
  );
}
