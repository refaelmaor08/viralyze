import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import AccessibilityMenu from "@/components/ui/AccessibilityMenu";
import Providers from "@/components/Providers";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Viralyze — AI לניתוח תוכן לפני שאתה מעלה",
  description:
    "לפני שאתה מעלה את הסרטון הבא — תדע אם הוא יעבוד. Viralyze מנתח את הסרטון שלך ומסביר בדיוק מה עלול לפגוע בביצועים ואיך לתקן.",
  keywords: "ניתוח תוכן, טיקטוק, אינסטגרם רילס, AI תוכן, וויראלי",
  openGraph: {
    title: "Viralyze — AI לניתוח תוכן",
    description: "תדע אם הסרטון שלך יעבוד לפני שאתה מעלה.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} antialiased`}>
      <body className="bg-[#080808] text-white min-h-screen font-[family-name:var(--font-heebo)]">
        <Providers>
          {children}
          <AccessibilityMenu />
        </Providers>
      </body>
    </html>
  );
}
