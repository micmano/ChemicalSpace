// app/login/LoginForm.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react';
//import { useFormState } from 'react-dom'
import { login, type LoginState } from './actions'
import Link from 'next/link'

const initialState: LoginState = {}

export default function LoginForm() {
  const router = useRouter()
  //const [state, formAction] = useFormState(login, initialState)
  const [state, formAction] = useActionState(login, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.replace('/dashboard?inv=general')
    }
  }, [state?.ok, router])

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm text-gray-300">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {/* Mensajes */}
      {state?.error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 px-3 py-2 text-sm text-green-200">
          ¡Ingreso correcto! Redirigiendo…
        </div>
      )}

      {/* Botonera centrada y con misma altura */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-black hover:bg-gray-200"
        >
          Entrar
        </button>

        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-700 px-4 text-sm font-medium text-gray-200 hover:bg-neutral-800"
        >
          Crear cuenta
        </Link>
      </div>
    </form>
  )
}
