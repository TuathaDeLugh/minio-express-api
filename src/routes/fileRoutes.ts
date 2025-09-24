import express from "express";
import upload from "../middleware/upload";
import {
  uploadFiles,
  replaceFile,
  listFiles,
  deleteFiles,
  getFileProxy,
} from "../controllers/fileController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Files
 *     description: File upload, retrieval, and management APIs
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Files]
 *     summary: Upload multiple files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *                 description: Target bucket name
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post("/upload", upload.array("files", 20), uploadFiles);

/**
 * @swagger
 * /upload:
 *   put:
 *     tags: [Files]
 *     summary: Replace an existing file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *                 description: Bucket name
 *               name:
 *                 type: string
 *                 description: Existing file name to replace
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File replaced successfully
 */
router.put("/upload", upload.single("file"), replaceFile);

/**
 * @swagger
 * /files:
 *   get:
 *     tags: [Files]
 *     summary: List files in a bucket
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *         description: Bucket name (optional)
 *     responses:
 *       200:
 *         description: Returns list of files
 */
router.get("/files", listFiles);

/**
 * @swagger
 * /storage/{bucket}/{name}:
 *   get:
 *     tags: [Files]
 *     summary: Retrieve a file from bucket
 *     parameters:
 *       - in: path
 *         name: bucket
 *         required: true
 *         schema:
 *           type: string
 *         description: Bucket name
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Full file path (supports subdirectories)
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/storage/:bucket/:name(*)", getFileProxy);

/**
 * @swagger
 * /files:
 *   delete:
 *     tags: [Files]
 *     summary: Delete multiple files
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Files deleted successfully
 */
router.delete("/files", deleteFiles);

export default router;
