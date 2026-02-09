import express from "express";
import { healthCheck } from "../controllers/health.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health check and monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and all connected services (MinIO)
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                     minio:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                         endpoint:
 *                           type: string
 *                 message:
 *                   type: string
 *       503:
 *         description: One or more services are down
 */
router.get("/health", healthCheck);

export default router;
