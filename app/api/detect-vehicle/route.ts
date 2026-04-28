import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const VALID_SIZES = ["XL", "L", "M", "Motorcycle"] as const;
type VehicleSize = (typeof VALID_SIZES)[number];

// ─── In-memory rate limiter (10 requests per IP per minute) ──────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-key-here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "imageBase64 and mimeType are required" },
      { status: 400 },
    );
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported image type" },
      { status: 400 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
    `Analyze this vehicle image and respond with JSON only, no markdown.

1. size: Classify the vehicle into exactly one: XL (SUV/van/pickup), L (sedan/hatchback/coupe), M (compact/city car), Motorcycle (motorcycle/scooter)
2. plate: Read the license plate number exactly as shown. If not visible or unreadable, return null.

Respond with ONLY this JSON format:
{"size": "L", "plate": "ABC-1234"}
or if no plate visible:
{"size": "XL", "plate": null}`,
  ]);

  const raw = result.response.text().trim();

  let parsed: { size?: string; plate?: string | null } = {};
  try {
    // Strip markdown code fences if Gemini wraps in ```json
    const clean = raw
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/```$/, "")
      .trim();
    parsed = JSON.parse(clean);
  } catch {
    // ignore parse error, fallback below
  }

  const detected = VALID_SIZES.find(
    (s) => s.toLowerCase() === (parsed.size ?? "").toLowerCase(),
  ) as VehicleSize | undefined;

  return NextResponse.json({
    size: detected ?? "L",
    plate: parsed.plate ?? null,
  });
}
