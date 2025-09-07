import { Client } from "minio";

const credenctials = {
  endPoint: process.env.MINIO_ENDPOINT || "storage.umangsailor.com",
  port: parseInt(process.env.MINIO_PORT || "443"),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || "admin",
  secretKey: process.env.MINIO_SECRET_KEY || "admin12345",
};
const minioClient = new Client(credenctials);

export default minioClient;
