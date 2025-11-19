import "../../globals.css";

export const metadata = {
  title: "Chatbot",
  description: "Mi app con Next.js + Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
