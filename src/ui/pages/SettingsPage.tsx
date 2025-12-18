import Card from '@/ui/components/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-slate-400">
          Este app é sem login. Configure tudo via secrets do Supabase.
        </p>
      </div>

      <Card>
        <div className="text-sm font-semibold">Supabase secrets</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
          <li><code className="text-slate-200">IG_BUSINESS_ID</code></li>
          <li><code className="text-slate-200">IG_ACCESS_TOKEN</code></li>
          <li><code className="text-slate-200">FB_PAGE_ID</code> (opcional para Page Insights)</li>
        </ul>
        <div className="mt-4 text-xs text-slate-400">
          O frontend usa <code className="text-slate-200">VITE_SUPABASE_URL</code> e <code className="text-slate-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> em <code className="text-slate-200">.env.local</code>.
        </div>
      </Card>
    </div>
  );
}

