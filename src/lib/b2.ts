import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** Region code from B2 bucket settings, e.g. eu-central-003 or us-west-004. */
function parseB2Region(endpoint: string): string {
  const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  if (!match) {
    throw new Error(
      "B2_ENDPOINT must be https://s3.<region>.backblazeb2.com — copy the S3 endpoint from your B2 bucket page (do not guess the region from your key ID)."
    );
  }
  return match[1];
}

function getClient() {
  const endpoint = process.env.B2_ENDPOINT?.replace(/\/$/, "");
  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const secret = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET_NAME;

  if (!endpoint || !keyId || !secret || !bucket) {
    throw new Error("Backblaze B2 environment variables are not configured");
  }

  const region = process.env.B2_REGION?.trim() || parseB2Region(endpoint);

  return {
    client: new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId: keyId, secretAccessKey: secret },
      forcePathStyle: true,
    }),
    bucket,
  };
}

function wrapUploadError(err: unknown): Error {
  if (!(err instanceof Error)) return new Error("Upload to storage failed");

  const msg = err.message.toLowerCase();
  if (msg.includes("enotfound") || msg.includes("getaddrinfo")) {
    return new Error(
      "Storage endpoint could not be reached. Check B2_ENDPOINT in .env matches the S3 endpoint shown on your Backblaze bucket page."
    );
  }
  if (msg.includes("invalidaccesskeyid") || msg.includes("signaturedoesnotmatch")) {
    return new Error("Backblaze credentials are invalid. Check B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY.");
  }

  return err;
}

/** Extract object key from a stored B2 URL (friendly or S3 path-style). */
export function b2KeyFromStoredUrl(url: string): string | null {
  const bucket = process.env.B2_BUCKET_NAME;
  if (!bucket) return null;

  try {
    const u = new URL(url);
    const fileMatch = u.pathname.match(/^\/file\/[^/]+\/(.+)$/);
    if (fileMatch) return decodeURIComponent(fileMatch[1]);

    const pathPrefix = `/${bucket}/`;
    if (u.pathname.startsWith(pathPrefix)) {
      return decodeURIComponent(u.pathname.slice(pathPrefix.length));
    }
  } catch {
    return null;
  }
  return null;
}

export function mediaProxyUrlForKey(key: string): string {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** Serve private B2 files through our media proxy; pass through external URLs. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/media/")) return url;

  const key = b2KeyFromStoredUrl(url);
  if (key?.startsWith("afresh/")) return mediaProxyUrlForKey(key);

  return url;
}

export async function getB2Object(key: string, range?: string) {
  const { client, bucket } = getClient();
  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    })
  );
}

export function validateUploadSize(bytes: number, kind: "image" | "video") {
  const max = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (bytes > max) {
    throw new Error(
      kind === "video"
        ? "Video must be under 100MB"
        : "Image must be under 15MB"
    );
  }
}

export async function uploadToB2(
  file: Buffer,
  opts: { folder: string; filename: string; contentType: string }
) {
  const { client, bucket } = getClient();
  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `afresh/${opts.folder}/${Date.now()}-${randomBytes(4).toString("hex")}-${safeName}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: opts.contentType,
      })
    );
  } catch (err) {
    throw wrapUploadError(err);
  }

  return { key, url: mediaProxyUrlForKey(key) };
}
