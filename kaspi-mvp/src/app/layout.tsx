import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Kaspi MVP Tracker",
  description: "Fast local-first expense tracking from pasted Kaspi text",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </body>
    </html>
  );
}
