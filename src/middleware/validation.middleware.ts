import { Request, Response, NextFunction } from "express";
import { MAX_UPLOAD_FILES } from "../constants";

/**
 * Middleware to enforce file upload limits
 * Slices the files array to MAX_UPLOAD_FILES and adds metadata about discarded files
 */
export const enforceFileLimit = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return next();
    }

    const totalFiles = files.length;

    if (totalFiles > MAX_UPLOAD_FILES) {
        // Slice to only keep the first MAX_UPLOAD_FILES
        req.files = files.slice(0, MAX_UPLOAD_FILES);

        // Add metadata to request for controller to use
        (req as any).fileUploadMetadata = {
            totalReceived: totalFiles,
            uploaded: MAX_UPLOAD_FILES,
            discarded: totalFiles - MAX_UPLOAD_FILES,
        };
    }

    next();
};
