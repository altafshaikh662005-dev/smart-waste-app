import OpenAI from "openai";

import { ComplaintPriority } from "@/models/Complaint";

const apiKey = process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

if (apiKey) {
  client = new OpenAI({ apiKey });
}

export interface AiAnalysisResult {
  wasteType?: string;
  priority: ComplaintPriority;
  tips?: string;
}

export async function analyzeComplaintWithAI(
  description: string,
  selectedWasteType?: string | null
): Promise<AiAnalysisResult> {
  // Fallback logic when OpenAI key is missing
  if (!client) {
    return fallbackAnalysis(description, selectedWasteType || undefined);
  }

  try {
    const prompt = `You are helping a smart city waste management system.
User complaint description:
"""${description}"""

The user-selected waste type (may be empty): "${selectedWasteType || ""}".

Respond STRICTLY as compact JSON with keys:
  wasteType: one of ["Organic","Plastic","Metal","Glass","E-waste","Mixed","Other"]
  priority: one of ["low","medium","high"]
  tips: short sentence with recycling / disposal advice.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200
    });

    const raw = completion.choices[0]?.message?.content || "";

    const parsed = JSON.parse(raw) as {
      wasteType?: string;
      priority?: ComplaintPriority;
      tips?: string;
    };

    return {
      wasteType: parsed.wasteType || selectedWasteType || "Mixed",
      priority: parsed.priority || fallbackAnalysis(description, selectedWasteType ?? undefined).priority,
      tips: parsed.tips
    };
  } catch {
    // If anything goes wrong, use deterministic fallback
    return fallbackAnalysis(description, selectedWasteType || undefined);
  }
}

function fallbackAnalysis(description: string, selectedWasteType?: string): AiAnalysisResult {
  const text = `${description} ${selectedWasteType || ""}`.toLowerCase();

  let priority: ComplaintPriority = "medium";

  if (text.includes("hospital") || text.includes("toxic") || text.includes("chemical")) {
    priority = "high";
  } else if (text.includes("overflow") || text.includes("bad smell") || text.includes("fire")) {
    priority = "high";
  } else if (text.includes("small") || text.includes("minor")) {
    priority = "low";
  }

  let tips = "Ensure waste is segregated into dry and wet categories where possible.";

  if (text.includes("plastic") || text.includes("bottle")) {
    tips = "Rinse and separate plastic bottles; send them to a nearby recycling facility.";
  } else if (text.includes("food") || text.includes("organic")) {
    tips = "Organic waste can often be composted; separate it from recyclable materials.";
  } else if (text.includes("e-waste") || text.includes("battery")) {
    tips =
      "E-waste should not be mixed with regular garbage; dispose of it at certified e-waste centers.";
  }

  return {
    wasteType: selectedWasteType || "Mixed",
    priority,
    tips
  };
}

