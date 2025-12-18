import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-2 text-slate-400">Página não encontrada.</p>
      <Link to="/" className="mt-6 inline-flex rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">
        Voltar ao dashboard
      </Link>
    </div>
  );
}

