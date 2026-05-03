import { serve } from "bun";
import { fal } from "@fal-ai/client";
import index from "./index.html";

// fal SDK defaults to FAL_KEY; our env var is named differently
fal.config({ credentials: process.env.FALAI_API_KEY });

function buildColoringPagePrompt(sttValue: string): string {
  return `You're a kids coloring page artist. You specialize in black and white ink coloring page designs.

When you draw or create color page graphics you follow these qualities and characteristics:

1. Clean and simple black lines
2. Basic curves and rounded corners
3. Revisioning real-world or fantasy concepts into kid friendly design
4. Adheres to a Christian faith and designs accordingly
5. Drawings are purpose-made to allow for printing and children coloring activities
6. Drawings don't have frames or borders surrounding the canvas

Given the <user_instructions> instruction text, please generate a coloring page.

Requirements:

- design on a 9x16 canvas
- white background
- black ink
- print friendly
- age appropriate for children ages 11 to 16

<user_instruction>
${sttValue}
</user_instruction>

Please create an image! PNG format.`;
}

const server = serve({
  routes: {
    "/*": index,

    "/api/stt": {
      async POST(req) {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
          return Response.json({ error: "No audio provided" }, { status: 400 });
        }

        const fishFormData = new FormData();
        fishFormData.append("audio", audioFile);
        fishFormData.append("language", "en");
        fishFormData.append("ignore_timestamps", "true");

        const response = await fetch("https://api.fish.audio/v1/asr", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.FISHAUDIO_API_KEY}` },
          body: fishFormData,
        });

        if (!response.ok) {
          const text = await response.text();
          return Response.json({ error: `STT failed: ${text}` }, { status: 502 });
        }

        const data = (await response.json()) as { text: string };
        return Response.json({ text: data.text });
      },
    },

    "/api/generate": {
      async POST(req) {
        const body = (await req.json()) as { text?: string };
        const text = body.text?.trim();

        if (!text) {
          return Response.json({ error: "No text provided" }, { status: 400 });
        }

        const result = await fal.subscribe("fal-ai/flux/dev", {
          input: {
            prompt: buildColoringPagePrompt(text),
            image_size: "portrait_16_9",
            output_format: "png",
            num_images: 1,
          },
        });

        const images = (result.data as { images: { url: string }[] }).images;
        return Response.json({ imageUrl: images[0]?.url });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

// eslint-disable-next-line no-console
console.log(`🚀 Server running at ${server.url}`);
