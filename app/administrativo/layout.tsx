import type { ReactNode } from 'react';
import AdministrativeSubmenu from '@/app/components/admin/administrativeSubmenu';

export default function AdministrativoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-neutral-50 lg:overflow-hidden">
      <AdministrativeSubmenu />
      <div className="min-h-0 flex-1 p-4 sm:p-5 lg:overflow-hidden">{children}</div>
    </div>
  );
}
