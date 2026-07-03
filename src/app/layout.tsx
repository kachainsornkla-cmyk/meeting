import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม | BOOKING PWK-ROOM",
  description: "ระบบจองห้องประชุมออนไลน์ ค้นหาห้องประชุม จองเวลาใช้งานแบบ Real-time สะดวก รวดเร็ว ปลอดภัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
