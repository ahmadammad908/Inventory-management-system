import { NextRequest } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Sale from "@/models/Sale";

export async function GET(req: NextRequest) {
  await connectDB();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial ping so client knows connection is alive
      send({ type: "connected" });

      // Watch Sale collection for any insert/update
      const changeStream = Sale.watch([], { fullDocument: "updateLookup" });

      changeStream.on("change", (change) => {
        send({ type: "sale_change", operation: change.operationType });
      });

      req.signal.addEventListener("abort", () => {
        changeStream.close();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}