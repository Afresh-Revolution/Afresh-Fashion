import { Readable } from "stream";
import { NextResponse } from "next/server";
import { getB2Object } from "@/lib/b2";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { path } = await params;
    const key = path.map((segment) => decodeURIComponent(segment)).join("/");

    if (!key.startsWith("afresh/") || key.includes("..")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const range = request.headers.get("range") ?? undefined;
    const object = await getB2Object(key, range);
    const body = object.Body;

    if (!body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream =
      body instanceof Readable ? Readable.toWeb(body) : (body as ReadableStream<Uint8Array>);

    const headers = new Headers();
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    if (object.ContentType) headers.set("Content-Type", object.ContentType);
    if (object.ContentLength != null) headers.set("Content-Length", String(object.ContentLength));
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    if (object.ETag) headers.set("ETag", object.ETag);

    return new NextResponse(stream, {
      status: range && object.ContentRange ? 206 : 200,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("NoSuchKey") || message.includes("NotFound") || message.includes("404")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Media stream error:", err);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
