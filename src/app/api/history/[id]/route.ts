import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import History from "@/lib/models/History";

// DELETE /api/history/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { message: "History log deleted (local emulation)", id, isMock: true },
        { status: 200 }
      );
    }

    await History.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "History log deleted successfully", id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/history/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete history log" },
      { status: 500 }
    );
  }
}
