import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/", fileRoutes);

app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
