import { Request, Response } from "express";
import minioClient, { ensureBucketExists } from "../config/minio";

const getFileUrl = (bucket: string, filename: string) => {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = process.env.API_ENDPOINT || "bucket.umangsailor.com";
  return `${protocol}://${endpoint}/storage/${bucket}/${filename}`;
};

export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";

    await ensureBucketExists(bucket);

    if (!files || files.length === 0)
      return res.status(400).json({ error: "No files uploaded" });

    const urls: string[] = [];
    for (const file of files) {
      await minioClient.putObject(
        bucket,
        file.originalname,
        file.buffer,
        file.size
      );
      urls.push(getFileUrl(bucket, file.originalname));
    }

    res.json({ message: "Files uploaded successfully", files: urls });
  } catch (err: any) {
    console.error("Hardcoded error in uploadFiles: ", err);
    res.status(500).json({ error: err.message });
  }
};

// Replace single file
export const replaceFile = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;
    const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
    const name = req.body.name;

    await ensureBucketExists(bucket);

    if (!file) return res.status(400).json({ error: "No file provided" });
    if (!name) return res.status(400).json({ error: "File name is required" });

    await minioClient.putObject(bucket, name, file.buffer, file.size);
    res.json({
      message: "File replaced successfully",
      url: getFileUrl(bucket, name),
    });
  } catch (err: any) {
    console.error("Hardcoded error in replaceFile: ", err);
    res.status(500).json({ error: err.message });
  }
};

// List files
export const listFiles = async (req: Request, res: Response) => {
  try {
    const bucket =
      req.query.bucket?.toString() || process.env.BUCKET_NAME || "testing";

    await ensureBucketExists(bucket);

    const objects: any[] = [];

    const stream = minioClient.listObjectsV2(bucket, "", true);
    stream.on("data", (obj: any) => {
      objects.push({
        name: obj.name,
        url: getFileUrl(bucket, obj.name),
        size: obj.size,
        lastModified: obj.lastModified,
      });
    });
    stream.on("end", () => res.json({ count: objects.length, files: objects }));
    stream.on("error", (err: Error) =>
      res.status(500).json({ error: err.message })
    );
  } catch (err: any) {
    console.error("Hardcoded error in listFiles: ", err);
    res.status(500).json({ error: err.message });
  }
};

export const getFileProxy = async (req: Request, res: Response) => {
  const bucket = req.params.bucket;
  const name = decodeURIComponent(req.params.name);

  try {
    const stream = await minioClient.getObject(bucket, name);
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(404).json({ error: "File not found" });
    });
  } catch (err: any) {
    console.error("Hardcoded error in getFileProxy: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteFiles = async (req: Request, res: Response) => {
  try {
    const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
    const names: string[] = req.body.names;

    await ensureBucketExists(bucket);

    if (!names || names.length === 0)
      return res.status(400).json({ error: "No files provided" });

    const deleted: string[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const name of names) {
      try {
        await minioClient.removeObject(bucket, name);
        deleted.push(name);
      } catch (err: any) {
        errors.push({ name, error: err.message });
      }
    }

    res.json({ message: "Delete operation completed", deleted, errors });
  } catch (err: any) {
    console.error("Hardcoded error in deleteFiles: ", err);
    res.status(500).json({ error: err.message });
  }
};
