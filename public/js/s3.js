const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function putToS3({ key, buffer, contentType }) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  }));
}

function isS3Image(imageUrl) {
  return typeof imageUrl === "string" && imageUrl.startsWith("s3:");
}

function s3KeyFromImageUrl(imageUrl) {
  return imageUrl.replace(/^s3:/, "");
}

module.exports = { putToS3, deleteFromS3, isS3Image, s3KeyFromImageUrl };
