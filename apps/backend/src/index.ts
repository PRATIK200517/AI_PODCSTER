import express, { Request, Response } from "express";
import router from "./routes/openai";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router2 from "./routes/services";
import profileRouter from "./routes/profileRouter";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// app.use((req, res, next) => {
//   console.log("Incoming request:", req.method, req.url);
//   next();
// });


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials:true
  })
);

app.use(router);
app.use(router2);
app.use(profileRouter);

app.get("/test", (req: Request, res: Response) => {
  res.send("Hello test");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on  http://localhost:${PORT}`);
  console.log("Loaded PORT from env:", process.env.PORT);
});
