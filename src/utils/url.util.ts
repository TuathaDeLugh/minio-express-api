import { API_ENDPOINT, getProtocol } from "../constants";

/**
 * Generate a public URL for a file in MinIO storage
 * @param bucket - The bucket name
 * @param filename - The file path/name within the bucket
 * @returns Full URL to access the file
 */
export const getFileUrl = (bucket: string, filename: string): string => {
    const protocol = getProtocol();
    return `${protocol}://${API_ENDPOINT}/storage/${bucket}/${filename}`;
};
