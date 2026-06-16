import './globals.css';
import Menu from '@/app/components/menu/menu';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden">
        <Providers>
          <div className="flex min-h-dvh flex-col bg-white lg:h-dvh lg:overflow-hidden">
            <Menu />
            <div className="min-h-0 flex-1 lg:overflow-hidden">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
