import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure this exists (standard Next.js)
import { GoogleProvider } from "@/context/GoogleContext";
import { GlobalStyles } from "@/components/GlobalStyles";
import ClientLayout from "@/components/ClientLayout"; // We need this to handle client-side sidebar state

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduAssist Pro",
  description: "Next Generation Academic Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-gray-800`}>
        <GoogleProvider>
          <GlobalStyles />
          <ClientLayout>{children}</ClientLayout>
        </GoogleProvider>
      </body>
    </html>
  );
}