import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./auth.css";
import Navigation from "./components/Navigation";
import MainContent from "./components/MainContent";
import { ThemeProvider } from "./components/ThemeProvider";
import { LocaleProvider } from "./components/LocaleProvider";
import { AuthModalProvider } from "./components/AuthModalContext";
import CsrfBootstrap from "./components/CsrfBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naad Official - Horoscope & Palmistry",
  description: "Discover your destiny through horoscope readings and palmistry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{const t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}const l=(localStorage.getItem('uiLanguage')||'en').toLowerCase().slice(0,2);if(l){document.documentElement.lang=l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LocaleProvider>
          <AuthModalProvider>
            <CsrfBootstrap />
            <Navigation />
            <MainContent>
              {children}
            </MainContent>
          </AuthModalProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
