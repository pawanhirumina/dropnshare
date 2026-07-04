import "./globals.css";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";
import { GeistMono } from "geist/font/mono";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Drop & Share - File Sharing Made Simple",
  description:
    "Share files instantly with a simple 6-digit code. No login required for free tier.",
  verification: {
    google: 'o_FZp9yWauyW7VkApRrBY93VaKJqgBpBsT409X63sZc',
  },
};

import { ThemeProvider } from "@/components/theme-provider";
// import { ReactGrab } from "react-grab";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )} */}
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* <ReactGrab> */}
          <Header />
          <Banner />

          <main className="min-h-screen pt-24">
            {children}
          </main>
          <Toaster position="bottom-right" />
          {/* </ReactGrab> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
