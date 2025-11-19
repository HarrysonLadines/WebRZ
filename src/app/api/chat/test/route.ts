export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const message = body.message ?? "";

  const encoder = new TextEncoder();

  // Creamos un stream simulado
  const stream = new ReadableStream({
    async start(controller) {
      const reply = `Simulación: recibí tu mensaje "${message}"`;
      for (let i = 0; i < reply.length; i += 3) {
        controller.enqueue(encoder.encode(reply.slice(i, i + 3)));
        await new Promise((r) => setTimeout(r, 150)); 
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
