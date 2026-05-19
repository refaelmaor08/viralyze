'use client';

import dynamic from 'next/dynamic';

const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false });

export default function AnimatedBackgroundClient() {
  return <AnimatedBackground />;
}
