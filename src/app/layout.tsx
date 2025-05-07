import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Roboto, Poppins, Lato, Open_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import ThemeProvider from './providers/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Load additional fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Dashboard",
  description: "All-in-one personal dashboard with widgets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`
        ${geistSans.variable} 
        ${geistMono.variable}
        ${inter.variable}
        ${roboto.variable}
        ${poppins.variable}
        ${lato.variable}
        ${openSans.variable}
        ${montserrat.variable}
      `}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
