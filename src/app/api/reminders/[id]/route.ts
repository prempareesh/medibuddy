import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Reminder from "@/lib/models/Reminder";

// PUT /api/reminders/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { _id: id, ...body, isMock: true },
        { status: 200 }
      );
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedReminder) {
      return NextResponse.json(
        { _id: id, ...body, isMock: true },
        { status: 200 }
      );
    }

    return NextResponse.json(updatedReminder, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/reminders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE /api/reminders/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { message: "Reminder deleted (local emulation)", id, isMock: true },
        { status: 200 }
      );
    }

    await Reminder.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "Reminder deleted successfully", id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/reminders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
