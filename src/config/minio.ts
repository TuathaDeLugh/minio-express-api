import { Client } from "minio";

const credenctials = {
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "admin",
  secretKey: process.env.MINIO_SECRET_KEY || "admin12345",
};
const minioClient = new Client(credenctials);

export const ensureBucketExists = async (bucket: string) => {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
    }
  } catch (err: any) {
    console.error("Hardcoded error in ensureBucketExists: ", err);
  }
};

export default minioClient;
