import { Request, Response } from "express";
import minioClient, { ensureBucketExists } from "../config/minio";
import { getFileUrl } from "../utils/url.util";
import { DEFAULT_BUCKET, MAX_UPLOAD_FILES } from "../constants";

export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const bucket = req.body.bucket || DEFAULT_BUCKET;
    const folder = req.body.folder || "";
    const randomName = req.body.randomName !== "false"; // Default to true if not explicitly set to "false"

    await ensureBucketExists(bucket);

    const uploadedFiles: Array<{
      originalName: string;
      name: string;
      url: string;
      size: number;
      time: string;
    }> = [];

    for (const file of files) {
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

    // Check if middleware added file limit metadata
    const metadata = (req as any).fileUploadMetadata;

    const response: any = {
      message: metadata
        ? `Only first ${MAX_UPLOAD_FILES} files uploaded due to max upload limit of ${MAX_UPLOAD_FILES}`
        : "Files uploaded successfully",
      files: uploadedFiles,
    };

    if (metadata) {
      response.warning = `${metadata.discarded} file(s) exceeded the limit and were not uploaded`;
      response.totalReceived = metadata.totalReceived;
      response.uploaded = metadata.uploaded;
      response.discarded = metadata.discarded;
    }

    res.json(response);
  } catch (err: any) {
    console.error("Error in uploadFiles:", err);
    res.status(500).json({ error: err.message });
  }
};

export const replaceFile = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;
    const bucket = req.body.bucket || DEFAULT_BUCKET;
    const folder = req.body.folder || "";
    const name = req.body.name;

    await ensureBucketExists(bucket);

    const objectName = folder ? `${folder}/${name}` : name;

    await minioClient.putObject(bucket, objectName, file.buffer, file.size);
    res.json({
      message: "File replaced successfully",
      url: getFileUrl(bucket, objectName),
    });
  } catch (err: any) {
    console.error("Error in replaceFile:", err);
    res.status(500).json({ error: err.message });
  }
};

// List files (supports folder filtering)
export const listFiles = async (req: Request, res: Response) => {
  try {
    const bucket = req.query.bucket?.toString() || DEFAULT_BUCKET;
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
    console.error("Error in listFiles:", err);
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
    console.error("Error in getFileProxy:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteFiles = async (req: Request, res: Response) => {
  try {
    const bucket = req.body.bucket || DEFAULT_BUCKET;
    const folder = req.body.folder || "";
    const names: string[] = req.body.names;

    await ensureBucketExists(bucket);

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
    console.error("Error in deleteFiles:", err);
    res.status(500).json({ error: err.message });
  }
};
