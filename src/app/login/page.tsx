'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace('/app');
      } else {
        router.replace('/login');
      }
    }

    run();
  }, [router]);

  return <p className="p-6">Redirecionando...</p>;
}
