'use client'

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-neutral-900/60 px-2 py-1 text-gray-200">{value}</code>
      <button
        type="button"
        onClick={copy}
        className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-neutral-800"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
