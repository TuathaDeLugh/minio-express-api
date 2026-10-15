import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetPresignedUploadUrlDto {
  @ApiProperty({
    description: "Original or desired file name with extension",
    required: true,
    example: "profile-photo.jpg",
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Subfolder path inside the bucket",
    required: false,
    example: "uploads",
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: "Generate a randomized timestamp/UUID filename prefix",
    required: false,
    default: "true",
    enum: ["true", "false"],
  })
  @IsString()
  @IsOptional()
  randomName?: string;

  @ApiProperty({
    description: "Expiry duration of the presigned URL in seconds (default: 3600, max: 604800 = 7 days)",
    required: false,
    default: 3600,
    example: 3600,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(604800)
  @IsOptional()
  expiresIn?: number;

  @ApiProperty({
    description: "MIME type of the media file (e.g. image/jpeg, video/mp4)",
    required: false,
    example: "image/jpeg",
  })
  @IsString()
  @IsOptional()
  contentType?: string;
}

export class GetPresignedDownloadUrlDto {
  @ApiProperty({
    description: "Object name or path inside bucket",
    required: true,
    example: "uploads/1740000000_profile-photo.jpg",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Folder prefix if not included in the name",
    required: false,
    example: "",
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: "Expiry duration of the presigned URL in seconds (default: 3600)",
    required: false,
    default: 3600,
    example: 3600,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(604800)
  @IsOptional()
  expiresIn?: number;
}

export class VerifySignedMediaDto {
  @ApiProperty({
    description: "Object name or path inside bucket to verify",
    required: true,
    example: "uploads/1740000000_profile-photo.jpg",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Folder prefix if not included in the name",
    required: false,
    example: "",
  })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class DeleteSignedMediaDto {
  @ApiProperty({
    description: "Object name or path inside bucket to delete",
    required: true,
    example: "uploads/1740000000_profile-photo.jpg",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Folder prefix if not included in the name",
    required: false,
    example: "",
  })
  @IsString()
  @IsOptional()
  folder?: string;
}
