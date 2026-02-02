import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import basicAuth from "express-basic-auth";


const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // or ['https://*.umangsailor.com']
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use("/", fileRoutes);

app.use(
  "/api",
  basicAuth({
    users: { [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "password" },
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
