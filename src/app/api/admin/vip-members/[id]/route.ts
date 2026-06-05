import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { cancelVipMember, removeVipMember } from "@/lib/vip";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action || "");

    if (action !== "cancel") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const reason = String(body.reason || "").trim();
    if (reason.length < 10) {
      return NextResponse.json(
        { error: "Cancellation reason must be at least 10 characters" },
        { status: 400 }
      );
    }

    const result = await cancelVipMember(id, reason, request);
    return NextResponse.json(result);
  } catch (err) {
    return adminError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await removeVipMember(id);
    return NextResponse.json(result);
  } catch (err) {
    return adminError(err);
  }
}
