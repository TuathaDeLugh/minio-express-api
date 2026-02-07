import { Request, Response } from "express";
import minioClient, { ensureBucketExists } from "../config/minio";

const getFileUrl = (bucket: string, filename: string) => {
  const protocol =
    process.env.API_ENDPOINT?.includes("localhost:") ||
    process.env.API_ENDPOINT?.includes("192.168.1.")
      ? "http"
      : "https";
  const endpoint = process.env.API_ENDPOINT || "bucket.umangsailor.com";
  return `${protocol}://${endpoint}/storage/${bucket}/${filename}`;
};

export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
    const folder = req.body.folder || "";
    const randomName = req.body.randomName !== "false"; // Default to true if not explicitly set to "false"

    await ensureBucketExists(bucket);

    if (!files || files.length === 0)
      return res.status(400).json({ error: "No files uploaded" });

    // File upload limit
    const MAX_FILES = 20;
    const totalFiles = files.length;
    const filesToUpload = files.slice(0, MAX_FILES);
    const discardedCount = totalFiles - MAX_FILES;

    const uploadedFiles: Array<{
      originalName: string;
      name: string;
      url: string;
      size: number;
      time: string;
    }> = [];

    for (const file of filesToUpload) {
      const originalName = file.originalname;
      const uploadTime = new Date().toISOString();
      
      // Generate filename based on randomName config
      let filename: string;
      if (randomName) {
        const timestamp = Date.now();
        const ext = originalName.substring(originalName.lastIndexOf('.'));
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        filename = `${timestamp}_${nameWithoutExt}${ext}`;
      } else {
        filename = originalName;
      }

      const objectName = folder ? `${folder}/${filename}` : filename;

      await minioClient.putObject(bucket, objectName, file.buffer, file.size);
      
      uploadedFiles.push({
        originalName,
        name: filename,
        url: getFileUrl(bucket, objectName),
        size: file.size,
        time: uploadTime,
      });
    }

    const response: any = {
      message: discardedCount > 0 
        ? `Only first ${MAX_FILES} media uploaded due to max ${MAX_FILES} limit. ${discardedCount} file(s) discarded.`
        : "Files uploaded successfully",
      files: uploadedFiles,
    };

    if (discardedCount > 0) {
      response.warning = `${discardedCount} file(s) exceeded the limit and were not uploaded`;
      response.totalReceived = totalFiles;
      response.uploaded = MAX_FILES;
      response.discarded = discardedCount;
    }

    res.json(response);
  } catch (err: any) {
    console.error("Hardcoded error in uploadFiles: ", err);
    res.status(500).json({ error: err.message });
  }
};

export const replaceFile = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;
    const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
    const folder = req.body.folder || "";
    const name = req.body.name;

    await ensureBucketExists(bucket);

    if (!file) return res.status(400).json({ error: "No file provided" });
    if (!name) return res.status(400).json({ error: "File name is required" });

    const objectName = folder ? `${folder}/${name}` : name;

    await minioClient.putObject(bucket, objectName, file.buffer, file.size);
    res.json({
      message: "File replaced successfully",
      url: getFileUrl(bucket, objectName),
    });
  } catch (err: any) {
    console.error("Hardcoded error in replaceFile: ", err);
    res.status(500).json({ error: err.message });
  }
};

// List files (supports folder filtering)
export const listFiles = async (req: Request, res: Response) => {
  try {
    const bucket =
      req.query.bucket?.toString() || process.env.BUCKET_NAME || "testing";
    const folder = req.query.folder?.toString() || "";

    await ensureBucketExists(bucket);

    const objects: any[] = [];
    const stream = minioClient.listObjectsV2(bucket, folder, true);

    stream.on("data", (obj: any) => {
      objects.push({
        name: obj.name,
        url: getFileUrl(bucket, obj.name),
        size: obj.size,
        time: obj.lastModified,
      });
    });

    stream.on("end", () => res.json({ count: objects.length, files: objects }));
    stream.on("error", (err: Error) =>
      res.status(500).json({ error: err.message }),
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
    const folder = req.body.folder || "";
    const names: string[] = req.body.names;

    await ensureBucketExists(bucket);

    if (!names || names.length === 0)
      return res.status(400).json({ error: "No files provided" });

    const deleted: string[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const name of names) {
      const objectName = folder ? `${folder}/${name}` : name;

      try {
        await minioClient.removeObject(bucket, objectName);
        deleted.push(objectName);
      } catch (err: any) {
        errors.push({ name: objectName, error: err.message });
      }
    }

    res.json({ message: "Delete operation completed", deleted, errors });
  } catch (err: any) {
    console.error("Hardcoded error in deleteFiles: ", err);
    res.status(500).json({ error: err.message });
  }
};
