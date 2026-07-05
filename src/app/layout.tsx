import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIPMS - Sistem Informasi Presensi Murid Sekolah",
  description: "Aplikasi administrasi sekolah dan pencatatan presensi siswa digital multi-tenant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
