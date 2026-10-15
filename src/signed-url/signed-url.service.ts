import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { MinioService } from "../minio/minio.service";
import { DEFAULT_BUCKET, API_ENDPOINT, getProtocol } from "../common/constants";
import {
  GetPresignedUploadUrlDto,
  GetPresignedDownloadUrlDto,
  VerifySignedMediaDto,
  DeleteSignedMediaDto,
} from "./dto/signed-url.dto";

@Injectable()
export class SignedUrlService {
  private readonly logger = new Logger(SignedUrlService.name);

  constructor(private readonly minioService: MinioService) {}

  /**
   * Helper to generate a public/proxy URL for a file in MinIO storage
   */
  private getFileUrl(bucket: string, filename: string): string {
    const protocol = getProtocol();
    return `${protocol}://${API_ENDPOINT}/storage/${bucket}/${filename}`;
  }

  /**
   * Resolve full object name from folder and name
   */
  private resolveObjectName(name: string, folder?: string): string {
    const trimmedFolder = folder?.replace(/^\/+|\/+$/g, "") || "";
    const cleanName = name.replace(/^\/+/, "");
    return trimmedFolder ? `${trimmedFolder}/${cleanName}` : cleanName;
  }

  /**
   * Generate a Presigned PUT URL for uploading single media directly to MinIO
   */
  async getPresignedUploadUrl(dto: GetPresignedUploadUrlDto) {
    const bucket = dto.bucket || DEFAULT_BUCKET;
    const folder = dto.folder?.replace(/^\/+|\/+$/g, "") || "";
    const randomName = dto.randomName !== "false";
    const expiresIn = dto.expiresIn || 3600;
    const originalName = dto.filename;

    await this.minioService.ensureBucketExists(bucket);

    let filename: string;
    if (randomName) {
      const timestamp = Date.now();
      const dotIndex = originalName.lastIndexOf(".");
      const ext = dotIndex !== -1 ? originalName.substring(dotIndex) : "";
      const nameWithoutExt = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      filename = `${timestamp}_${nameWithoutExt}${ext}`;
    } else {
      filename = originalName;
    }

    const objectName = folder ? `${folder}/${filename}` : filename;
    const minioClient = this.minioService.getClient();

    try {
      const uploadUrl = await minioClient.presignedPutObject(
        bucket,
        objectName,
        expiresIn
      );

      return {
        success: true,
        message: "Presigned upload URL generated successfully",
        uploadUrl,
        fileUrl: this.getFileUrl(bucket, objectName),
        bucket,
        folder,
        name: filename,
        path: objectName,
        expiresIn,
        method: "PUT",
        headers: dto.contentType ? { "Content-Type": dto.contentType } : {},
        instructions: {
          method: "PUT",
          url: uploadUrl,
          notes: "Send the raw binary file as the request body with HTTP PUT method directly to uploadUrl",
        },
      };
    } catch (err: any) {
      this.logger.error(
        `Error generating presigned PUT URL for ${bucket}/${objectName}:`,
        err
      );
      throw new InternalServerErrorException(
        `Failed to generate presigned upload URL: ${err.message}`
      );
    }
  }

  /**
   * Generate a Presigned GET URL for viewing or downloading media
   */
  async getPresignedDownloadUrl(dto: GetPresignedDownloadUrlDto) {
    const bucket = dto.bucket || DEFAULT_BUCKET;
    const objectName = this.resolveObjectName(dto.name, dto.folder);
    const expiresIn = dto.expiresIn || 3600;

    await this.minioService.ensureBucketExists(bucket);
    const minioClient = this.minioService.getClient();

    try {
      const downloadUrl = await minioClient.presignedGetObject(
        bucket,
        objectName,
        expiresIn
      );

      return {
        success: true,
        message: "Presigned download URL generated successfully",
        downloadUrl,
        bucket,
        name: objectName,
        expiresIn,
      };
    } catch (err: any) {
      this.logger.error(
        `Error generating presigned GET URL for ${bucket}/${objectName}:`,
        err
      );
      throw new InternalServerErrorException(
        `Failed to generate presigned download URL: ${err.message}`
      );
    }
  }

  /**
   * Verify and get metadata of media uploaded via signed URL
   */
  async verifyMedia(dto: VerifySignedMediaDto) {
    const bucket = dto.bucket || DEFAULT_BUCKET;
    const objectName = this.resolveObjectName(dto.name, dto.folder);

    await this.minioService.ensureBucketExists(bucket);
    const minioClient = this.minioService.getClient();

    try {
      const stat = await minioClient.statObject(bucket, objectName);

      return {
        success: true,
        exists: true,
        bucket,
        name: objectName,
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: (stat.metaData as any)?.["content-type"] || undefined,
        url: this.getFileUrl(bucket, objectName),
      };
    } catch (err: any) {
      this.logger.warn(`Media verification failed for ${bucket}/${objectName}: ${err.message}`);
      throw new NotFoundException(
        `File not found in bucket '${bucket}': ${objectName}`
      );
    }
  }

  /**
   * Delete single media uploaded via signed URL
   */
  async deleteMedia(dto: DeleteSignedMediaDto) {
    const bucket = dto.bucket || DEFAULT_BUCKET;
    const objectName = this.resolveObjectName(dto.name, dto.folder);

    await this.minioService.ensureBucketExists(bucket);
    const minioClient = this.minioService.getClient();

    try {
      await minioClient.removeObject(bucket, objectName);
      return {
        success: true,
        message: "Media deleted successfully",
        bucket,
        name: objectName,
      };
    } catch (err: any) {
      this.logger.error(
        `Error deleting object ${bucket}/${objectName}:`,
        err
      );
      throw new InternalServerErrorException(
        `Failed to delete file: ${err.message}`
      );
    }
  }
}
