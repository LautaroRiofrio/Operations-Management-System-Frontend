'use client'

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { href: '/recepcion', label: 'Recepcion' },
  { href: '/produccion', label: 'Produccion' },
  { href: '/entrega', label: 'Entrega' },
];

const ADMIN_MENU_ITEMS = [
  { href: '/administrativo/categorias', label: 'Catalogo' },
  { href: '/administrativo/metricas', label: 'Metricas' },
];

export default function Menu() {
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopAdminMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileAdminMenuRef = useRef<HTMLDivElement | null>(null);
  const isAdministrativePath = pathname.startsWith('/administrativo');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedDesktopMenu = desktopAdminMenuRef.current?.contains(targetNode);
      const clickedMobileMenu = mobileAdminMenuRef.current?.contains(targetNode);

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        setIsAdminOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    setIsAdminOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="relative z-30 border-b border-black/10 bg-white px-4 py-3 sm:px-6 lg:px-10 lg:py-2">
      <div className="flex items-center justify-between gap-4 lg:h-14 lg:gap-8">
        <h1 className="flex-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
          Operations Management System
        </h1>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Abrir menu de navegacion"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-900 text-white transition hover:bg-neutral-700 lg:hidden"
        >
          <span className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>

        <nav className="hidden flex-1 gap-5 lg:flex">
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/administrativo' && pathname.startsWith('/administrativo'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`rounded-md px-3 py-2 text-center text-sm transition-colors sm:text-base lg:flex-1 ${
                  isActive
                    ? 'bg-[#101010] text-white'
                    : 'bg-[#303030] text-white hover:bg-[#101010]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative col-span-2 lg:flex-1" ref={desktopAdminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminOpen((currentValue) => !currentValue)}
              className={`w-full rounded-md px-3 py-2 text-center text-sm transition-colors sm:text-base ${
                isAdministrativePath
                  ? 'bg-[#101010] text-white'
                  : 'bg-[#303030] text-white hover:bg-[#101010]'
              }`}
            >
              Administrativo
            </button>

            {isAdminOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl lg:left-auto lg:min-w-full">
                {ADMIN_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <nav className="mt-4 grid gap-3 lg:hidden">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`rounded-md px-3 py-3 text-center text-sm transition-colors ${
                  isActive
                    ? 'bg-[#101010] text-white'
                    : 'bg-[#303030] text-white hover:bg-[#101010]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative" ref={mobileAdminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminOpen((currentValue) => !currentValue)}
              className={`w-full rounded-md px-3 py-3 text-center text-sm transition-colors ${
                isAdministrativePath
                  ? 'bg-[#101010] text-white'
                  : 'bg-[#303030] text-white hover:bg-[#101010]'
              }`}
            >
              Administrativo
            </button>

            {isAdminOpen ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
                {ADMIN_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
