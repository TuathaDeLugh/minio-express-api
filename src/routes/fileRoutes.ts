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
 * /upload:
 *   post:
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
 *                 description: Bucket name
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
 *     summary: Replace a single file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *               name:
 *                 type: string
 *                 description: Name of the file to replace
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
 *     summary: List all files in bucket
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *         required: false
 *         description: Bucket name
 *     responses:
 *       200:
 *         description: List of files
 */
router.get("/files", listFiles);

/**
 * @swagger
 * /storage/{bucket}/{name}:
 *   get:
 *     summary: Get a single file preview
 *     description: Retrieves a preview of a file from the specified bucket
 *     tags:
 *       - Storage
 *     parameters:
 *       - in: path
 *         name: bucket
 *         required: true
 *         schema:
 *           type: string
 *         description: The bucket name where the file is stored
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file to retrieve
 *     responses:
 *       200:
 *         description: File preview retrieved successfully
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
router.get("/storage/:bucket/:name", getFileProxy);

/**
 * @swagger
 * /files:
 *   delete:
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
 *         description: Delete operation completed
 */
router.delete("/files", deleteFiles);

export default router;
