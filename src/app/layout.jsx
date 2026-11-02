import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  weight: "200 800",
});

export const metadata = {
  title: "Ihsan Fawwas Zaidan | Personal Portfolio",
  description:
    "Personal portfolio of Ihsan Fawwas Zaidan, showcasing web development projects, skills, experience, and creative work.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.variable}>{children}</body>
    </html>
  );
}
