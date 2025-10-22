'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window { initRDKitModule?: (opts: any) => Promise<any> }
}

let rdkitLoading: Promise<any> | null = null;
let RDKitModule: any = null;

async function ensureRDKit(): Promise<any> {
  if (RDKitModule) return RDKitModule;
  if (!rdkitLoading) {
    rdkitLoading = new Promise((resolve, reject) => {
      function init() {
        if (!window.initRDKitModule) {
          reject(new Error('initRDKitModule no encontrado'));
          return;
        }
        window
          .initRDKitModule({ locateFile: (file: string) => `/rdkit/${file}` })
          .then((mod: any) => { RDKitModule = mod; resolve(mod); })
          .catch(reject);
      }
      const existing = document.querySelector('script[data-rdkit]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', init, { once: true });
        if ((existing as any)._loaded) init();
      } else {
        const s = document.createElement('script');
        s.src = '/rdkit/RDKit_minimal.js';
        s.async = true;
        s.dataset.rdkit = '1';
        s.onload = () => { (s as any)._loaded = true; init(); };
        s.onerror = () => reject(new Error('No se pudo cargar RDKit_minimal.js'));
        document.head.appendChild(s);
      }
    });
  }
  return rdkitLoading;
}

/** Normaliza el SVG para tema oscuro:
 * - quita rectángulos de fondo blanco y background-color
 * - cambia strokes/fills negros a blanco puro (#FFFFFF)
 */
function toDarkSvg(svg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.documentElement;

  // 1) Remover rects de fondo blancos (RDKit suele poner el primero)
  const isWhite = (v?: string | null) =>
    !!v && /(white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(v);

  doc.querySelectorAll('rect').forEach((rect) => {
    const fill = rect.getAttribute('fill') ?? rect.getAttribute('style');
    if (isWhite(fill)) rect.remove();
  });

  // 2) Quitar background-color si viene inline
  const style = svgEl.getAttribute('style');
  if (style?.includes('background')) {
    svgEl.setAttribute('style', style.replace(/background[^;"]*;?/gi, ''));
  }

  // 3) Forzar enlaces/etiquetas negras a blanco puro
  const toWhite = (s: string) =>
    s
      .replace(/stroke:\s*(?:#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi, 'stroke:#FFFFFF')
      .replace(/fill:\s*(?:#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi, 'fill:#FFFFFF');

  doc.querySelectorAll<HTMLElement>('*').forEach((el: any) => {
    // Atributos directos
    const stroke = el.getAttribute('stroke');
    if (stroke && /^(#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))$/i.test(stroke)) {
      el.setAttribute('stroke', '#FFFFFF');
    }
    const fill = el.getAttribute('fill');
    if (fill && /^(#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))$/i.test(fill)) {
      el.setAttribute('fill', '#FFFFFF');
    }
    // Estilos inline
    const st = el.getAttribute('style');
    if (st) el.setAttribute('style', toWhite(st));
  });

  // 4) Asegurar fondo transparente
  svgEl.setAttribute('style', (svgEl.getAttribute('style') ?? '') + ';background:none');

  return new XMLSerializer().serializeToString(doc);
}

export default function MoleculeViewer({
  smiles,
  width = 320,
  height = 240,
}: { smiles: string; width?: number; height?: number }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setSvg(null);
    setError(null);

    ensureRDKit()
      .then((RDKit) => {
        if (!mounted) return;
        try {
          const mol = RDKit.get_mol(smiles);
          if (!mol) { setError('SMILES inválido'); return; }
          let svgText = mol.get_svg() as string;
          mol.delete();
          svgText = toDarkSvg(svgText);
          if (mounted) setSvg(svgText);
        } catch {
          setError('No se pudo renderizar la molécula');
        }
      })
      .catch((e) => setError(e.message));

    return () => { mounted = false; };
  }, [smiles]);

  if (error) return <div className="text-xs text-red-400">RDKit: {error}</div>;
  if (!svg) return <div className="text-xs text-gray-400">Cargando estructura…</div>;

  return (
    <div
      style={{ width, height }}
      className="[&_svg]:h-full [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
