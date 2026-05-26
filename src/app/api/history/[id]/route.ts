import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import History from "@/lib/models/History";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/history/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ success: true, deletedId: id, isMock: true }, { status: 200 });
    }

    const deletedHistory = await History.findByIdAndDelete(id);

    if (!deletedHistory) {
      return NextResponse.json({ error: "History log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/history/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete history log" }, { status: 500 });
  }
}
