'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { href: '/recepcion', label: 'Recepcion' },
  { href: '/produccion', label: 'Produccion' },
  { href: '/entrega', label: 'Entrega' },
  { href: '/administrativo', label: 'Administrativo' },
];

export default function Menu() {
  const pathname = usePathname();

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
        </nav>
      </div>
    </header>
  );
}
