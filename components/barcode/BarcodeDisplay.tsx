"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
  format?: string;
}

export function BarcodeDisplay({
  value,
  width = 1.6,
  height = 45,
  fontSize = 13,
  displayValue = true,
  className = "",
  format = "CODE128",
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: format,
        width: width,
        height: height,
        displayValue: displayValue,
        font: "monospace",
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 3,
        fontSize: fontSize,
        background: "#ffffff",
        lineColor: "#0f172a",
        margin: 6,
      });
    } catch (err) {
      console.warn("JsBarcode rendering warning:", err);
    }
  }, [value, width, height, fontSize, displayValue, format]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-1 rounded border border-slate-200 ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
}
