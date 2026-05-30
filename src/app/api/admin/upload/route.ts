import { NextResponse } from "next/server";
import { uploadToB2, validateUploadSize } from "@/lib/b2";
import { requireAdmin, UnauthorizedError } from "@/lib/require-admin";
import { apiErrorResponse } from "@/lib/safe-api-error";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "uploads");
    const kind = String(form.get("kind") || "image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isVideo = kind === "video";
    if (isVideo && !VIDEO_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Video must be MP4, WebM, or MOV" }, { status: 400 });
    }
    if (!isVideo && !IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Image must be JPEG, PNG, WebP, or GIF" }, { status: 400 });
    }

    validateUploadSize(file.size, isVideo ? "video" : "image");

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToB2(buffer, {
      folder,
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      url: result.url,
      key: result.key,
      size: file.size,
      contentType: file.type,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return apiErrorResponse(err, "Upload failed", 500);
  }
}
