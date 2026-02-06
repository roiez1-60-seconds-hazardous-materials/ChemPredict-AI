import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChemPredict AI — Chemical Reaction & Risk Prediction",
  description:
    "AI-powered chemical reaction prediction and hazard analysis for first responders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
