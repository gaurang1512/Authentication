import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { createClient } from "redis";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

await connectDB();

//Redis part
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.log("Missing redis url");
  process.exit(1);
}
export const redisClient = createClient({
  url: redisUrl,
});
redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());
//as we have to store cookies we have to give options in cors
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, //backend credentials can read frontend credentials like cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], //giving access to these methods
    allowedHeaders: ["Content-Type", "Authorization"], //used during csrf token implementation
  })
);
// Handle invalid/malformed JSON body errors from `express.json()`
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    // body-parser / express.json uses this type for parse failures
    return res
      .status(400)
      .json({ message: "Invalid JSON payload", error: err.message });
  }
  // Fallback for SyntaxError thrown by other parsers
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res
      .status(400)
      .json({ message: "Invalid JSON payload", error: err.message });
  }
  return next(err);
});

//importoing routes
import userRoutes from "./routes/user.js";
//using routes
app.use("/api/v1", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
