import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const endPoint = this.configService.get<string>("minio.endPoint", "localhost");
    const port = this.configService.get<number>("minio.port", 9000);
    const useSSL = this.configService.get<boolean>("minio.useSSL", false);
    const accessKey = this.configService.get<string>("minio.accessKey", "admin");
    const secretKey = this.configService.get<string>("minio.secretKey", "admin12345");

    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
    this.logger.log("MinIO client initialized successfully");
  }

  getClient(): Client {
    return this.client;
  }

  async validateBucketExists(bucket: string): Promise<void> {
    if (!bucket || typeof bucket !== "string") {
      throw new NotFoundException(
        "Requested bucket is not existed or you don't have access"
      );
    }

    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        throw new NotFoundException(
          "Requested bucket is not existed or you don't have access"
        );
      }
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error validating bucket existence for bucket ${bucket}:`, err);
      if (
        err.message?.includes("Invalid bucket name") ||
        err.code === "NoSuchBucket" ||
        err.code === "NotFound" ||
        err.code === "AccessDenied" ||
        err.code === "Forbidden" ||
        err.statusCode === 404 ||
        err.statusCode === 403
      ) {
        throw new NotFoundException(
          "Requested bucket is not existed or you don't have access"
        );
      }
      throw new InternalServerErrorException(
        `Failed to verify bucket: ${err.message}`
      );
    }
  }

  async ensureBucketExists(bucket: string): Promise<void> {
    return this.validateBucketExists(bucket);
  }
}
