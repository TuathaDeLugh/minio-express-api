import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "../constants";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export default upload;
