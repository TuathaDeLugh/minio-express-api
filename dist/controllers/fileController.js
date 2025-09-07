"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiles = exports.getFileProxy = exports.listFiles = exports.replaceFile = exports.uploadFiles = void 0;
const minio_1 = __importDefault(require("../config/minio"));
const getFileUrl = (bucket, filename) => {
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const endpoint = process.env.MINIO_ENDPOINT || "localhost:4000";
    return `${protocol}://${endpoint}/storage/${bucket}/${filename}`;
};
const uploadFiles = async (req, res) => {
    try {
        const files = req.files;
        const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
        if (!files || files.length === 0)
            return res.status(400).json({ error: "No files uploaded" });
        const urls = [];
        for (const file of files) {
            await minio_1.default.putObject(bucket, file.originalname, file.buffer, file.size);
            urls.push(getFileUrl(bucket, file.originalname));
        }
        res.json({ message: "Files uploaded successfully", files: urls });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
exports.uploadFiles = uploadFiles;
// Replace single file
const replaceFile = async (req, res) => {
    try {
        const file = req.file;
        const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
        const name = req.body.name;
        if (!file)
            return res.status(400).json({ error: "No file provided" });
        if (!name)
            return res.status(400).json({ error: "File name is required" });
        await minio_1.default.putObject(bucket, name, file.buffer, file.size);
        res.json({
            message: "File replaced successfully",
            url: getFileUrl(bucket, name),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
exports.replaceFile = replaceFile;
// List files
const listFiles = async (req, res) => {
    try {
        const bucket = req.query.bucket?.toString() || process.env.BUCKET_NAME || "testing";
        const objects = [];
        const stream = minio_1.default.listObjectsV2(bucket, "", true);
        stream.on("data", (obj) => {
            objects.push({
                name: obj.name,
                url: getFileUrl(bucket, obj.name),
                size: obj.size,
                lastModified: obj.lastModified,
            });
        });
        stream.on("end", () => res.json({ count: objects.length, files: objects }));
        stream.on("error", (err) => res.status(500).json({ error: err.message }));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
exports.listFiles = listFiles;
const getFileProxy = async (req, res) => {
    try {
        const { bucket, name } = req.params;
        const bucketExists = await minio_1.default.bucketExists(bucket);
        if (!bucketExists) {
            return res.status(404).json({ error: "Bucket not found" });
        }
        try {
            await minio_1.default.statObject(bucket, name);
        }
        catch {
            return res.status(404).json({ error: "File not found" });
        }
        const stream = await minio_1.default.getObject(bucket, name);
        res.setHeader("Content-Disposition", `inline; filename="${name}"`);
        stream.pipe(res);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getFileProxy = getFileProxy;
const deleteFiles = async (req, res) => {
    try {
        const bucket = req.body.bucket || process.env.BUCKET_NAME || "testing";
        const names = req.body.names;
        if (!names || names.length === 0)
            return res.status(400).json({ error: "No files provided" });
        const deleted = [];
        const errors = [];
        for (const name of names) {
            try {
                await minio_1.default.removeObject(bucket, name);
                deleted.push(name);
            }
            catch (err) {
                errors.push({ name, error: err.message });
            }
        }
        res.json({ message: "Delete operation completed", deleted, errors });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
exports.deleteFiles = deleteFiles;
