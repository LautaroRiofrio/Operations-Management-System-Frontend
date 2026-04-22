import './globals.css';
import Menu from '@/app/components/menu/menu';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-dvh overflow-hidden">
        <Providers>
          <div className="flex h-screen flex-col overflow-hidden">
            <Menu />
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
