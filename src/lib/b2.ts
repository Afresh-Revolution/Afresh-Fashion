import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function getClient() {
  const endpoint = process.env.B2_ENDPOINT;
  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const secret = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET_NAME;

  if (!endpoint || !keyId || !secret || !bucket) {
    throw new Error("Backblaze B2 environment variables are not configured");
  }

  return {
    client: new S3Client({
      endpoint,
      region: "us-west-003",
      credentials: { accessKeyId: keyId, secretAccessKey: secret },
      forcePathStyle: true,
    }),
    bucket,
  };
}

function publicUrl(bucket: string, key: string) {
  const base =
    process.env.B2_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `${process.env.B2_ENDPOINT?.replace(/\/$/, "")}/${bucket}`;
  return `${base}/${key}`;
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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: opts.contentType,
    })
  );

  return { key, url: publicUrl(bucket, key) };
}
