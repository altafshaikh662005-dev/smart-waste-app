import OpenAI from "openai";
import path from "path";
import fs from "fs/promises";

import { ComplaintPriority } from "@/models/Complaint";

const apiKey = process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

if (apiKey) {
  client = new OpenAI({ apiKey });
}

const geminiKey = process.env.GEMINI_API_KEY;

async function callGemini(
  prompt: string,
  maxOutputTokens = 256,
  temperature = 0.2,
): Promise<string> {
  if (!geminiKey) throw new Error("No Gemini key");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-flash:generateText?key=${geminiKey}`;

  const body = {
    prompt: { text: prompt },
    temperature,
    maxOutputTokens,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  const candidate = json?.candidates?.[0];
  if (candidate) return candidate.output || candidate.content || "";
  return "";
}

export interface AiAnalysisResult {
  wasteType?: string;
  priority: ComplaintPriority;
  tips?: string;
}

async function detectImageLabelsWithVision(
  imageBuffer: Buffer,
): Promise<string[] | null> {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) return null;

    const b64 = imageBuffer.toString("base64");

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: b64 },
              features: [{ type: "LABEL_DETECTION", maxResults: 8 }],
            },
          ],
        }),
      },
    );

    const json = await res.json();
    const labels =
      json.responses?.[0]?.labelAnnotations?.map((l: any) => l.description) ||
      [];
    return labels;
  } catch (e) {
    return null;
  }
}

export async function analyzeImageBuffer(
  imageBuffer: Buffer,
  description?: string,
): Promise<{
  wasteType?: string;
  tips?: string;
  priority?: ComplaintPriority;
}> {
  const labels = await detectImageLabelsWithVision(imageBuffer);

  const promptParts: string[] = [];
  if (description) promptParts.push(`User description: ${description}`);
  if (labels && labels.length)
    promptParts.push(`Detected labels: ${labels.join(", ")}`);

  const prompt = `You are an assistant for a city waste reporting app. Given the following context, respond STRICTLY with compact JSON: { "wasteType": one of ["Organic","Plastic","Metal","Glass","E-waste","Mixed","Other"], "priority": one of ["low","medium","high"], "tips": short disposal/recycling advice }\n\nContext:\n${promptParts.join("\n")}`;

  // If no model clients are available, fallback to label heuristics
  if (!client && !geminiKey) {
    if (labels && labels.length) {
      const txt = labels.join(" ").toLowerCase();
      if (
        txt.includes("food") ||
        txt.includes("banana") ||
        txt.includes("apple")
      ) {
        return {
          wasteType: "Organic",
          priority: "medium",
          tips: "Compost organic waste when possible.",
        };
      }
      if (txt.includes("bottle") || txt.includes("plastic")) {
        return {
          wasteType: "Plastic",
          priority: "low",
          tips: "Rinse and recycle plastic bottles.",
        };
      }
      if (txt.includes("battery") || txt.includes("electronic")) {
        return {
          wasteType: "E-waste",
          priority: "high",
          tips: "Dispose e-waste at certified centers.",
        };
      }
    }
    return { wasteType: undefined, priority: "medium", tips: undefined };
  }

  try {
    let raw = "";
    if (geminiKey) {
      raw = await callGemini(prompt, 250, 0.1);
    } else {
      const completion = await client!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 250,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const parsed = JSON.parse(raw) as {
      wasteType?: string;
      priority?: ComplaintPriority;
      tips?: string;
    };
    return {
      wasteType: parsed.wasteType,
      priority: parsed.priority,
      tips: parsed.tips,
    };
  } catch (e) {
    if (labels && labels.length) {
      const txt = labels.join(" ").toLowerCase();
      if (
        txt.includes("food") ||
        txt.includes("banana") ||
        txt.includes("apple")
      ) {
        return {
          wasteType: "Organic",
          priority: "medium",
          tips: "Compost organic waste when possible.",
        };
      }
      if (txt.includes("bottle") || txt.includes("plastic")) {
        return {
          wasteType: "Plastic",
          priority: "low",
          tips: "Rinse and recycle plastic bottles.",
        };
      }
    }
    return { wasteType: undefined, priority: "medium", tips: undefined };
  }
}

export async function analyzeComplaintWithAI(
  description: string,
  selectedWasteType?: string | null,
  imagePath?: string | null,
): Promise<AiAnalysisResult> {
  if (imagePath) {
    try {
      const abs = path.join(
        process.cwd(),
        imagePath.startsWith("/") ? imagePath.slice(1) : imagePath,
      );
      const bytes = await fs.readFile(abs);
      const imgResult = await analyzeImageBuffer(bytes, description);
      return {
        wasteType: imgResult.wasteType || selectedWasteType || "Mixed",
        priority:
          imgResult.priority ||
          fallbackAnalysis(description, selectedWasteType ?? undefined)
            .priority,
        tips: imgResult.tips,
      };
    } catch (e) {
      // fall through to text analysis
    }
  }

  // Text-only analysis
  const prompt = `You are helping a smart city waste management system.\nUser complaint description:\n"""${description}"""\n\nThe user-selected waste type (may be empty): "${selectedWasteType || ""}".\n\nRespond STRICTLY as compact JSON with keys:\n  wasteType: one of ["Organic","Plastic","Metal","Glass","E-waste","Mixed","Other"]\n  priority: one of ["low","medium","high"]\n  tips: short sentence with recycling / disposal advice.`;

  if (!client && !geminiKey) {
    return fallbackAnalysis(description, selectedWasteType || undefined);
  }

  try {
    let raw = "";
    if (geminiKey) {
      raw = await callGemini(prompt, 200, 0.2);
    } else {
      const completion = await client!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 200,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const parsed = JSON.parse(raw) as {
      wasteType?: string;
      priority?: ComplaintPriority;
      tips?: string;
    };
    return {
      wasteType: parsed.wasteType || selectedWasteType || "Mixed",
      priority:
        parsed.priority ||
        fallbackAnalysis(description, selectedWasteType ?? undefined).priority,
      tips: parsed.tips,
    };
  } catch (e) {
    return fallbackAnalysis(description, selectedWasteType || undefined);
  }
}

function fallbackAnalysis(
  description: string,
  selectedWasteType?: string,
): AiAnalysisResult {
  const text = `${description} ${selectedWasteType || ""}`.toLowerCase();

  let priority: ComplaintPriority = "medium";

  if (
    text.includes("hospital") ||
    text.includes("toxic") ||
    text.includes("chemical")
  ) {
    priority = "high";
  } else if (
    text.includes("overflow") ||
    text.includes("bad smell") ||
    text.includes("fire")
  ) {
    priority = "high";
  } else if (text.includes("small") || text.includes("minor")) {
    priority = "low";
  }

  let tips =
    "Ensure waste is segregated into dry and wet categories where possible.";

  if (text.includes("plastic") || text.includes("bottle")) {
    tips =
      "Rinse and separate plastic bottles; send them to a nearby recycling facility.";
  } else if (text.includes("food") || text.includes("organic")) {
    tips =
      "Organic waste can often be composted; separate it from recyclable materials.";
  } else if (text.includes("e-waste") || text.includes("battery")) {
    tips =
      "E-waste should not be mixed with regular garbage; dispose of it at certified e-waste centers.";
  }

  return {
    wasteType: selectedWasteType || "Mixed",
    priority,
    tips,
  };
}
