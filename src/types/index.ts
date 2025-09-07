import { Request } from "express";

export interface FileUploadRequest extends Request {
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
}

export interface DeleteRequest extends Request {
  body: {
    names: string[];
    bucket?: string;
  };
}
