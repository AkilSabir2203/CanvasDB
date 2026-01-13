import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/Navbar";
import { getCurrentUser } from "./actions/getCurrentUser";
import LoginModal from "./components/modals/LoginModal";
import RegisterModal from "./components/modals/RegisterModal";
import Providers from "./providers/Providers";

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
        <Providers>
          <LoginModal />
          <RegisterModal />
          <Navbar currentUser={currentUser} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
