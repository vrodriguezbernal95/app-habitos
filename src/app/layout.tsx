import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { SessionProvider } from "@/components/layout/SessionProvider";

export const metadata: Metadata = {
  title: "Hábitos — Tu mejor versión, un día a la vez",
  description: "App de seguimiento de hábitos con análisis intradía y rachas.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        {/* Anti-flash: aplica el tema guardado antes de que React hidrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
