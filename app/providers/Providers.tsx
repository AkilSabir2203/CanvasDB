"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import ToasterProvider from "@/app/providers/ToasterProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ToasterProvider />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
