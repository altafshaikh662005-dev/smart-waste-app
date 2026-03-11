import { NextRequest, NextResponse } from "next/server";
import { analyzeImageBuffer } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    if (
      !imageFile ||
      typeof imageFile !== "object" ||
      !("arrayBuffer" in imageFile)
    ) {
      return NextResponse.json(
        { error: "Image file required." },
        { status: 400 },
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await analyzeImageBuffer(buffer);

    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    console.error("AI analyze error", err);
    return NextResponse.json(
      { error: "Failed to analyze image." },
      { status: 500 },
    );
  }
}
