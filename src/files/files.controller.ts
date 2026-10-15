import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { FilesService } from "./files.service";
import { UploadFilesDto } from "./dto/upload-files.dto";
import { UploadSingleFileDto } from "./dto/upload-single-file.dto";
import { ReplaceFileDto } from "./dto/replace-file.dto";
import { DeleteFilesDto } from "./dto/delete-files.dto";
import { FileLimitInterceptor } from "../common/interceptors/file-limit.interceptor";
import { MULTER_MAX_FILES } from "../common/constants";

@ApiTags("Files")
@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(
    FilesInterceptor("files", MULTER_MAX_FILES),
    FileLimitInterceptor
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload multiple files (max 20 by default)",
    description:
      "Upload multiple files to MinIO storage. The maximum number of files is configurable via MAX_UPLOAD_FILES environment variable.",
  })
  @ApiBody({ type: UploadFilesDto })
  @ApiResponse({
    status: 200,
    description: "Files uploaded successfully",
  })
  @ApiResponse({
    status: 400,
    description: "No files uploaded or request validation failed",
  })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadFilesDto: UploadFilesDto,
    @Req() req: Request
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    const metadata = (req as any).fileUploadMetadata;
    return this.filesService.uploadFiles(files, uploadFilesDto, metadata);
  }

  @Post("upload/single")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload a single file",
    description: "Upload a single file directly to MinIO storage.",
  })
  @ApiBody({ type: UploadSingleFileDto })
  @ApiResponse({
    status: 200,
    description: "File uploaded successfully",
  })
  @ApiResponse({
    status: 400,
    description: "No file uploaded or request validation failed",
  })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadSingleFileDto: UploadSingleFileDto
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    return this.filesService.uploadSingleFile(file, uploadSingleFileDto);
  }

  @Put("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Replace an existing file",
    description: "Uploads a new file and overwrites an existing file in MinIO storage.",
  })
  @ApiBody({ type: ReplaceFileDto })
  @ApiResponse({
    status: 200,
    description: "File replaced successfully",
  })
  @ApiResponse({
    status: 400,
    description: "No file provided or missing file name to replace",
  })
  async replaceFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() replaceFileDto: ReplaceFileDto
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    if (!replaceFileDto.name) {
      throw new BadRequestException("File name is required");
    }

    return this.filesService.replaceFile(file, replaceFileDto);
  }

  @Get("files")
  @ApiOperation({
    summary: "List files in a bucket",
    description: "Lists all files inside a bucket and optional subfolder.",
  })
  @ApiQuery({
    name: "bucket",
    required: false,
    type: String,
    description: "Bucket name (optional)",
  })
  @ApiQuery({
    name: "folder",
    required: false,
    type: String,
    description: "Folder path (optional)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns list of files",
  })
  async listFiles(
    @Query("bucket") bucket?: string,
    @Query("folder") folder?: string
  ) {
    return this.filesService.listFiles(bucket, folder);
  }

  @Get("storage/:bucket/:name(*)")
  @ApiOperation({
    summary: "Retrieve a file from bucket",
    description: "Proxies retrieval from MinIO storage and streams back the response.",
  })
  @ApiParam({
    name: "bucket",
    type: String,
    description: "Bucket name",
  })
  @ApiParam({
    name: "name",
    type: String,
    description: "Full file path/name within the bucket",
  })
  @ApiResponse({
    status: 200,
    description: "File retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "File not found",
  })
  async getFileProxy(
    @Param("bucket") bucket: string,
    @Param("name") name: string,
    @Res() res: Response
  ) {
    const decodedName = decodeURIComponent(name);
    try {
      const stream = await this.filesService.getFileProxy(bucket, decodedName);

      res.setHeader("Content-Disposition", `inline; filename="${decodedName}"`);
      stream.pipe(res);

      stream.on("error", (err: any) => {
        if (!res.headersSent) {
          if (
            err?.code === "NoSuchBucket" ||
            err?.code === "AccessDenied" ||
            err?.message?.includes("Invalid bucket name")
          ) {
            res.status(HttpStatus.NOT_FOUND).json({
              statusCode: HttpStatus.NOT_FOUND,
              message: "Requested bucket is not existed or you don't have access",
              error: "Not Found",
            });
          } else {
            res.status(HttpStatus.NOT_FOUND).json({
              statusCode: HttpStatus.NOT_FOUND,
              message: "File not found",
              error: "Not Found",
            });
          }
        }
      });
    } catch (err: any) {
      if (!res.headersSent) {
        const status = err.getStatus ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const response = err.getResponse ? err.getResponse() : { message: err.message };
        res.status(status).json(response);
      }
    }
  }

  @Delete("files")
  @ApiOperation({
    summary: "Delete multiple files",
    description: "Performs bulk deletion of files inside a bucket.",
  })
  @ApiResponse({
    status: 200,
    description: "Files deleted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "No files provided for deletion",
  })
  async deleteFiles(@Body() deleteFilesDto: DeleteFilesDto) {
    if (!deleteFilesDto.names || deleteFilesDto.names.length === 0) {
      throw new BadRequestException("No files provided");
    }

    return this.filesService.deleteFiles(deleteFilesDto);
  }
}
