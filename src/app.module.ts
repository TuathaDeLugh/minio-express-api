import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import minioConfig from "./config/minio.config";
import { MinioModule } from "./minio/minio.module";
import { HealthModule } from "./health/health.module";
import { FilesModule } from "./files/files.module";
import { SignedUrlModule } from "./signed-url/signed-url.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [minioConfig],
    }),
    MinioModule,
    HealthModule,
    FilesModule,
    SignedUrlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
