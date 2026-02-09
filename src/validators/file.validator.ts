import { Request, Response, NextFunction } from "express";

/**
 * Validate file upload request
 */
export const validateUploadRequest = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    next();
};

/**
 * Validate file replacement request
 */
export const validateReplaceRequest = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const file = req.file as Express.Multer.File;
    const name = req.body.name;

    if (!file) {
        return res.status(400).json({ error: "No file provided" });
    }

    if (!name) {
        return res.status(400).json({ error: "File name is required" });
    }

    next();
};

/**
 * Validate file deletion request
 */
export const validateDeleteRequest = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const names: string[] = req.body.names;

    if (!names || names.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }

    next();
};
