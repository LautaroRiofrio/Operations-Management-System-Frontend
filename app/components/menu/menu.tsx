'use client'

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { href: '/recepcion', label: 'Recepcion' },
  { href: '/produccion', label: 'Produccion' },
  { href: '/entrega', label: 'Entrega' },
];

export default function Menu() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const isAdministrativePath = pathname.startsWith('/administrativo');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!adminMenuRef.current?.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigateToAdministrativeArea = (target: string) => {
    setIsAdminOpen(false);
    router.push(target);
  };

  return (
    <header className="border-b border-black/10 bg-white px-10 py-2">
      <div className="flex h-14 items-center gap-8">
        <h1 className="flex-1 text-2xl font-semibold text-neutral-900">
          Operations Management System
        </h1>

        <nav className="flex flex-1 gap-5">
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/administrativo' && pathname.startsWith('/administrativo'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 rounded-md px-2 py-2 text-center transition-colors ${
                  isActive
                    ? 'bg-[#101010] text-white'
                    : 'bg-[#303030] text-white hover:bg-[#101010]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative flex-1" ref={adminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminOpen((currentValue) => !currentValue)}
              className={`w-full rounded-md px-2 py-2 text-center transition-colors ${
                isAdministrativePath
                  ? 'bg-[#101010] text-white'
                  : 'bg-[#303030] text-white hover:bg-[#101010]'
              }`}
            >
              Administrativo
            </button>

            {isAdminOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => navigateToAdministrativeArea('/administrativo/categorias')}
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
                >
                  Catalogo
                </button>
                <button
                  type="button"
                  onClick={() => navigateToAdministrativeArea('/administrativo/metricas')}
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
                >
                  Metricas
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
