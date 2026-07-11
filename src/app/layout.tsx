import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anteiku - AI情绪陪伴',
  description: 'Anteiku - 一个安静的地方，有人愿意听你说。面向城市独居青年的AI情感陪伴空间。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
