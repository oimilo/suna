'use client';

import { ReactNode } from 'react';

export type Step = Record<string, unknown>;

export type CallBackProps = Record<string, unknown>;

export const STATUS = {
  FINISHED: 'finished',
  SKIPPED: 'skipped',
} as const;

export interface JoyrideProps {
  steps?: Step[];
  run?: boolean;
  stepIndex?: number;
  callback?: (data: CallBackProps) => void;
  continuous?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  disableOverlayClose?: boolean;
  disableScrollParentFix?: boolean;
  styles?: Record<string, unknown>;
  locale?: Record<string, unknown>;
  debug?: boolean;
  children?: ReactNode;
}

export default function Joyride(_props: JoyrideProps) {
  return null;
}

