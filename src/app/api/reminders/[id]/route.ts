import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Reminder from "@/lib/models/Reminder";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/reminders/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    const body = await request.json();

    if (!db) {
      // Mock success for SQLite/LocalStorage fallback client
      return NextResponse.json({ success: true, updatedFields: body, isMock: true }, { status: 200 });
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json(updatedReminder, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/reminders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

// DELETE /api/reminders/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      // Mock success
      return NextResponse.json({ success: true, deletedId: id, isMock: true }, { status: 200 });
    }

    const deletedReminder = await Reminder.findByIdAndDelete(id);

    if (!deletedReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/reminders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}
