'use client'
import { useEffect, useState } from 'react'

declare global {
  interface Window { initRDKitModule?: (opts: any) => Promise<any> }
}

let rdkitLoading: Promise<any> | null = null
let RDKitModule: any = null

async function ensureRDKit(): Promise<any> {
  if (RDKitModule) return RDKitModule
  if (!rdkitLoading) {
    rdkitLoading = new Promise((resolve, reject) => {
      function init() {
        if (!window.initRDKitModule) return reject(new Error('initRDKitModule no encontrado'))
        window
          .initRDKitModule({ locateFile: (f: string) => `/rdkit/${f}` })
          .then((mod: any) => { RDKitModule = mod; resolve(mod) })
          .catch(reject)
      }
      const existing = document.querySelector('script[data-rdkit]') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', init, { once: true })
        if ((existing as any)._loaded) init()
      } else {
        const s = document.createElement('script')
        s.src = '/rdkit/RDKit_minimal.js'
        s.async = true
        s.dataset.rdkit = '1'
        s.onload = () => { ;(s as any)._loaded = true; init() }
        s.onerror = () => reject(new Error('No se pudo cargar RDKit_minimal.js'))
        document.head.appendChild(s)
      }
    })
  }
  return rdkitLoading
}

function fmt(n?: number | null, digits = 3) {
  if (n == null || isNaN(+n)) return '—'
  return Number(n).toFixed(digits)
}

/** Extrae la fórmula desde InChI: InChI=1S/C5H4O2/...  ->  C5H4O2 */
function formulaFromInChI(inchi: string): string | null {
  const m = inchi.match(/^InChI=1S?\/([^/]+)/)
  return m ? m[1] : null
}

/** Reemplaza separadores para sales/solvatos: "." -> "·" (punto medio) */
function normalizeSeparators(s: string) {
  return s.replace(/\./g, '·')
}

/** Renderiza fórmula con subíndices usando <sub> con tamaño intermedio */
function renderFormula(formula: string) {
  const norm = normalizeSeparators(formula)
  // Separa bloques de dígitos vs. no dígitos
  const parts = norm.split(/([0-9]+)/)
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? (
          <sub key={i} className="text-xs align-baseline">{p}</sub>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

export default function MoleculeComputed({ smiles, field }: { smiles: string; field: 'formula' | 'mw' }) {
  // Para "formula" guardamos la fórmula cruda y la renderizamos con <sub>
  const [formula, setFormula] = useState<string | null>(null)
  // Para "mw" mostramos texto ya formateado
  const [text, setText] = useState<string>('calculando…')

  useEffect(() => {
    let mounted = true
    // Estados iniciales por campo
    if (field === 'formula') {
      setFormula(null)
      setText('calculando…')
    } else {
      setText('calculando…')
    }

    ensureRDKit()
      .then(RDKit => {
        if (!mounted) return
        try {
          const mol = RDKit.get_mol(smiles)
          if (!mol) {
            if (field === 'formula') setFormula('—')
            else setText('—')
            return
          }

          if (field === 'formula') {
            const inchi = mol.get_inchi()
            const f = formulaFromInChI(inchi) ?? '—'
            setFormula(f)
          } else {
            const desc = JSON.parse(mol.get_descriptors()) as { amw?: number; exactmw?: number }
            setText(`${fmt(desc?.amw)} (exacta: ${fmt(desc?.exactmw)})`)
          }

          mol.delete()
        } catch {
          if (field === 'formula') setFormula('—')
          else setText('—')
        }
      })
      .catch(() => {
        if (field === 'formula') setFormula('—')
        else setText('—')
      })

    return () => { mounted = false }
  }, [smiles, field])

  return (
    <span className="whitespace-nowrap">
      {field === 'formula'
        ? (formula ? renderFormula(formula) : 'calculando…')
        : text}
    </span>
  )
}
