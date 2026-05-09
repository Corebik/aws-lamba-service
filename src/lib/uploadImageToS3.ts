import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client();
const bucket = process.env.AUCTIONS_BUCKET_NAME!;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

export const uploadImageToS3 = async (key: string, buffer: Buffer) => {
  try {
    const result = await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      }),
    );

    const location = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

    return location;
  } catch (error) {
    console.error(`uploadImageToS3 error: ${error}`);
    throw new Error(`Could not upload image to S3: ${error}`);
  }
};