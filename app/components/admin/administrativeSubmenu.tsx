'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_ITEMS = [
  { href: '/administrativo/categorias', label: 'Categorias' },
  { href: '/administrativo/ingredientes', label: 'Ingredientes' },
  { href: '/administrativo/productos', label: 'Productos' },
];

export default function AdministrativeSubmenu() {
  const pathname = usePathname();

  return (
    <div className="border-b border-black/10 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Administrativo
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">Gestion de catalogo</h1>
        </div>

        <nav className="flex gap-3">
          {ADMIN_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
