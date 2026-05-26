import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import History from "@/lib/models/History";

// GET /api/history
export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Using local fallback.", isFallback: true },
        { status: 200 }
      );
    }
    const histories = await History.find({}).sort({ createdAt: -1 }).limit(10);
    return NextResponse.json(histories, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/history error:", error);
    return NextResponse.json({ error: "Failed to fetch history logs" }, { status: 500 });
  }
}

// POST /api/history
export async function POST(request: Request) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const { medicineName, purpose, usage, precautions, sideEffects, imageUrl } = body;

    if (!medicineName) {
      return NextResponse.json({ error: "Medicine name is required" }, { status: 400 });
    }

    if (!db) {
      const mockHistory = {
        _id: `mock_${Date.now()}`,
        medicineName,
        purpose: purpose || "",
        usage: usage || "",
        precautions: precautions || "",
        sideEffects: sideEffects || "",
        imageUrl: imageUrl || "",
        createdAt: new Date()
      };
      return NextResponse.json({ ...mockHistory, isMock: true }, { status: 201 });
    }

    const newHistory = new History({
      medicineName,
      purpose: purpose || "",
      usage: usage || "",
      precautions: precautions || "",
      sideEffects: sideEffects || "",
      imageUrl: imageUrl || ""
    });

    await newHistory.save();
    return NextResponse.json(newHistory, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/history error:", error);
    return NextResponse.json({ error: "Failed to save history log" }, { status: 500 });
  }
}
