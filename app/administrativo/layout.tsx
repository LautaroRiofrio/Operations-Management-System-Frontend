import type { ReactNode } from 'react';
import AdministrativeSubmenu from '@/app/components/admin/administrativeSubmenu';

export default function AdministrativoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-neutral-50">
      <AdministrativeSubmenu />
      <div className="min-h-0 flex-1 overflow-hidden p-5">{children}</div>
    </div>
  );
}
