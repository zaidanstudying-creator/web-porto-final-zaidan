"use client";

import CardSwap, { Card } from "@/components/react-bits/CardSwap";

export default function CardSwapPreview() {
  return (
    <CardSwap
      width={300}
      height={250}
      visibleCards={1}
      theme="light"
      autoplay={false}
      intro={false}
      draggable
    >
      <Card className="lab-sample-card">
        <span className="lab-kicker">Test card / 01</span>
        <strong>Registry component</strong>
        <span>No project content or remote image.</span>
      </Card>
    </CardSwap>
  );
}
