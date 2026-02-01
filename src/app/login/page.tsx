'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Se já estiver logado, não faz sentido ficar no /login
  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/app');
    }
    check();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace('/app');
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-600">Use /login para acessar o sistema.</p>

        {msg && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </p>
        )}

        <form onSubmit={handleLogin} className="grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border px-3 py-2"
          />

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            type="password"
            className="rounded-xl border px-3 py-2"
          />

          <button
            disabled={loading}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
