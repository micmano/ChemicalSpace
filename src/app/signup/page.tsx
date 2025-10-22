import Link from "next/link";
import { signupWithProfile } from "./actions";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold text-gray-100">Crear cuenta</h1>

        <form className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300">Nick</label>
            <input
              name="nick"
              type="text"
              required
              className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="Tu Nick"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="tucorreo@ejemplo.com"
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
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              formAction={signupWithProfile}
              className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-200"
            >
              Crear cuenta
            </button>

            <Link
              href="/login"
              className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}