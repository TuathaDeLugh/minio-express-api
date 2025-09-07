import swaggerJsdoc from "swagger-jsdoc";

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
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
