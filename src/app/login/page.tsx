// app/login/page.tsx
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold text-gray-100">Ingresar</h1>
        <LoginForm />
      </div>
    </div>
  );
}
