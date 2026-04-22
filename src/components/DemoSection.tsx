"use client";

import dynamic from "next/dynamic";

const IronTrackDemo = dynamic(() => import("@/components/IronTrackDemo"), { ssr: false });

export default function DemoSection() {
  return <IronTrackDemo />;
}
