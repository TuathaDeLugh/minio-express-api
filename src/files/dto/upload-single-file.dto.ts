import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UploadSingleFileDto {
  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Folder path inside the bucket",
    required: false,
    example: "media",
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: "Generate random name for the file",
    required: false,
    default: "true",
    enum: ["true", "false"],
  })
  @IsString()
  @IsOptional()
  randomName?: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Single file to upload",
  })
  file: any;
}
