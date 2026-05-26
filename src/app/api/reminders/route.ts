import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Reminder from "@/lib/models/Reminder";

// GET /api/reminders
export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Using local fallback.", isFallback: true },
        { status: 200 }
      );
    }
    const reminders = await Reminder.find({}).sort({ createdAt: -1 });
    return NextResponse.json(reminders, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/reminders error:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

// POST /api/reminders
export async function POST(request: Request) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const { medicineName, time, note } = body;

    if (!medicineName || !time) {
      return NextResponse.json({ error: "Medicine name and time are required" }, { status: 400 });
    }

    if (!db) {
      // Return a simulated created reminder if MongoDB isn't configured
      const mockReminder = {
        _id: `mock_${Date.now()}`,
        medicineName,
        time,
        note: note || "",
        active: true,
        takenDates: [],
        createdAt: new Date()
      };
      return NextResponse.json({ ...mockReminder, isMock: true }, { status: 201 });
    }

    const newReminder = new Reminder({
      medicineName,
      time,
      note: note || "",
      active: true,
      takenDates: []
    });

    await newReminder.save();
    return NextResponse.json(newReminder, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reminders error:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
