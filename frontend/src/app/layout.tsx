import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AiChatWidget from "./components/AiChatWidget";

export const metadata: Metadata = {
  title: "SmartCart AI",
  description: "AI shopping assistant web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <AiChatWidget />
        </Providers>
      </body>
    </html>
  );
}