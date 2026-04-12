import './globals.css'
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-dvh overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
