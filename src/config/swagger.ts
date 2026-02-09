import swaggerJsdoc from "swagger-jsdoc";

const isDevelopment = process.env.NODE_ENV !== "production";
const routePath = isDevelopment ? "./src/routes/*.ts" : "./dist/routes/*.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Umang Sailor Storage Bucket",
      version: "1.0.0",
      description:
        "API for uploading, listing, previewing, replacing, and deleting files using MinIO",
    },
  },
  apis: [routePath],
};

export const swaggerSpec = swaggerJsdoc(options);
