import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '安定区 - 你的情绪安全空间',
  description: '一个安静的地方，有人愿意听你说。面向城市独居青年的AI情感陪伴空间。',
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
