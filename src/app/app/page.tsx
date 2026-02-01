'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  nome: string;
  whatsapp: string | null;
  nicho: string | null;
  status: string | null;
  observacao: string | null;
  created_at: string;
};

const STATUS_OPTIONS = ['novo', 'em_andamento', 'fechado'] as const;

export default function AppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Form mínimo (criar)
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nicho, setNicho] = useState('');
  const [observacao, setObservacao] = useState('');

  async function loadLeads() {
    setMsg(null);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    setLeads((data as Lead[]) ?? []);
  }

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace('/login');
        return;
      }

      await loadLeads();
      setLoading(false);
    }

    boot();
  }, [router]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!nome.trim()) {
      setMsg('Nome é obrigatório.');
      return;
    }

    // NÃO envia status nem user_id: o banco define status='novo' e user_id=auth.uid()
    const { error } = await supabase.from('leads').insert([
      {
        nome: nome.trim(),
        whatsapp: whatsapp.trim() || null,
        nicho: nicho.trim() || null,
        observacao: observacao.trim() || null,
      },
    ]);

    if (error) {
      setMsg(error.message);
      return;
    }

    setNome('');
    setWhatsapp('');
    setNicho('');
    setObservacao('');

    await loadLeads();
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    setMsg(null);

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Atualiza tela sem depender de reload
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  }

  async function deleteLead(leadId: string) {
    const ok = window.confirm('Tem certeza que deseja excluir este lead?');
    if (!ok) return;

    setMsg(null);

    const { error } = await supabase.from('leads').delete().eq('id', leadId);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Remove da lista na hora (sem F5)
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return <p className="p-6">Carregando...</p>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">/app (Dia 5)</h1>

        <button
          onClick={handleLogout}
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>

      {msg && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {msg}
        </p>
      )}

      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Criar lead</h2>

        <form onSubmit={handleCreateLead} className="mt-4 grid gap-3 max-w-xl">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (obrigatório)"
            className="rounded-xl border px-3 py-2"
          />

          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp"
            className="rounded-xl border px-3 py-2"
          />

          <input
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
            placeholder="Nicho"
            className="rounded-xl border px-3 py-2"
          />

          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
            className="min-h-[90px] rounded-xl border px-3 py-2"
          />

          <button className="rounded-xl bg-black px-4 py-2 text-white">
            Salvar lead (status nasce como "novo")
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meus leads</h2>

          <button
            onClick={loadLeads}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Recarregar
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {leads.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum lead ainda.</p>
          ) : (
            leads.map((l) => (
              <div key={l.id} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{l.nome}</p>

                  <div className="flex items-center gap-2">
                    <select
                      value={(l.status ?? 'novo') as string}
                      onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                      className="rounded-xl border px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteLead(l.id)}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  WhatsApp: {l.whatsapp ?? '-'} | Nicho: {l.nicho ?? '-'}
                </p>

                {l.observacao ? (
                  <p className="text-sm text-gray-700">{l.observacao}</p>
                ) : null}

                <p className="text-xs text-gray-500">
                  Criado em: {new Date(l.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
