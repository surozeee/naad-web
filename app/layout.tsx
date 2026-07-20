import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import "./auth.css";
import "./customer.css";
import Navigation from "./components/Navigation";
import MainContent from "./components/MainContent";
import { ThemeProvider } from "./components/ThemeProvider";
import { LocaleProvider } from "./components/LocaleProvider";
import { AuthModalProvider } from "./components/AuthModalContext";
import CsrfBootstrap from "./components/CsrfBootstrap";
import { SessionProvider } from "./components/providers/SessionProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Naad Official — Horoscope & Guidance",
  description: "Clear daily horoscope readings and thoughtful spiritual guidance from Naad Official.",
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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')t='celestial';else if(t==='dark')t='cosmic';if(t!=='cosmic'&&t!=='celestial'&&t!=='divine')t='cosmic';document.documentElement.setAttribute('data-theme',t);var dark=t!=='celestial';if(dark){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}var l=(localStorage.getItem('uiLanguage')||'en').toLowerCase().slice(0,2);if(l){document.documentElement.lang=l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${cormorant.variable} ${sourceSans.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <LocaleProvider>
              <AuthModalProvider>
                <CsrfBootstrap />
                <Navigation />
                <MainContent>{children}</MainContent>
              </AuthModalProvider>
            </LocaleProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
