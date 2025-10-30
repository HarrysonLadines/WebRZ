import "../../globals.css";

export const metadata = {
  title: "Chatbot",
  description: "ChatBot usando Next.js y OpenAI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
