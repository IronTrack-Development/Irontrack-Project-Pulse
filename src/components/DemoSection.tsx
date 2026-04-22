"use client";

import dynamic from "next/dynamic";

// @ts-expect-error — JSX demo component, no type declarations
const IronTrackDemo = dynamic(() => import("@/components/IronTrackDemo"), { ssr: false });

export default function DemoSection() {
  return <IronTrackDemo />;
}
