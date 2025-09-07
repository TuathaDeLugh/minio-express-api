"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Umang Sailor Storage Bucket",
            version: "1.0.0",
            description: "API for uploading, listing, previewing, replacing, and deleting files using MinIO",
        },
    },
    apis: ["./src/routes/*.ts"],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
