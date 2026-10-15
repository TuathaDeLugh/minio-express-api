import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { SignedUrlService } from "./signed-url.service";
import {
  GetPresignedUploadUrlDto,
  GetPresignedDownloadUrlDto,
  VerifySignedMediaDto,
  DeleteSignedMediaDto,
} from "./dto/signed-url.dto";

@ApiTags("Signed URL")
@Controller("signed-url")
export class SignedUrlController {
  constructor(private readonly signedUrlService: SignedUrlService) {}

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate presigned upload URL for single media",
    description:
      "Generates a presigned PUT URL allowing the client to upload a single media file directly to MinIO storage. Avoids routing heavy payloads through the backend.",
  })
  @ApiBody({ type: GetPresignedUploadUrlDto })
  @ApiResponse({
    status: 200,
    description: "Presigned upload URL generated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request payload",
  })
  async getPresignedUploadUrl(@Body() dto: GetPresignedUploadUrlDto) {
    return this.signedUrlService.getPresignedUploadUrl(dto);
  }

  @Get("download")
  @ApiOperation({
    summary: "Generate presigned download URL for media",
    description:
      "Generates a temporary signed GET URL to securely access or download media from MinIO with an expiration window.",
  })
  @ApiResponse({
    status: 200,
    description: "Presigned download URL generated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "File not found",
  })
  async getPresignedDownloadUrl(@Query() dto: GetPresignedDownloadUrlDto) {
    return this.signedUrlService.getPresignedDownloadUrl(dto);
  }

  @Get("verify")
  @ApiOperation({
    summary: "Verify and inspect media uploaded via signed URL",
    description:
      "Checks whether the media was successfully uploaded to MinIO via presigned URL and returns its object metadata (size, lastModified, etag, and URL).",
  })
  @ApiResponse({
    status: 200,
    description: "Media verified and metadata retrieved",
  })
  @ApiResponse({
    status: 404,
    description: "File not found in storage",
  })
  async verifyMedia(@Query() dto: VerifySignedMediaDto) {
    return this.signedUrlService.verifyMedia(dto);
  }

  @Delete("file")
  @ApiOperation({
    summary: "Delete a single media file",
    description: "Deletes a specific media file from the bucket.",
  })
  @ApiResponse({
    status: 200,
    description: "File deleted successfully",
  })
  @ApiResponse({
    status: 500,
    description: "Failed to delete file",
  })
  async deleteMedia(@Query() dto: DeleteSignedMediaDto) {
    return this.signedUrlService.deleteMedia(dto);
  }
}
