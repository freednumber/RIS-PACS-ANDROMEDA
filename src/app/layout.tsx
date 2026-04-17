import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CornerstoneInit from "@/components/pacs/CornerstoneInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Andromeda | Sistema Radiologico",
  description: "Andromeda: sistema per la gestione di immagini radiologiche con firma digitale del paziente e condivisione cross-istituto",
  keywords: ["PACS", "RIS", "radiologia", "DICOM", "immagini mediche"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased text-white`}>
        <CornerstoneInit />
        {children}
      </body>
    </html>
  );
}
