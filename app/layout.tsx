import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ClientOnly from "./components/ClientOnly";
import Navbar from "./components/navbar/Navbar";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import ToasterProvider from "@/app/providers/ToasterProvider";
import { getCurrentUser } from "./actions/getCurrentUser";
import LoginModal from "./components/modals/LoginModal";
import RegisterModal from "./components/modals/RegisterModal";

const nunito = Nunito({
   subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CanvasDB",
  description: "CanvasDB App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  return (
    <html lang="en">
      <body className={nunito.className}>
        <ClientOnly>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <ToasterProvider />
          <LoginModal />
          <RegisterModal />
          <Navbar currentUser={currentUser} />
          </ThemeProvider>
        </ClientOnly>
        <div>{children}</div>
      </body>
    </html>
  );
}
