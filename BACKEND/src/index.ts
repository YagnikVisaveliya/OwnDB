import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import instancesRouter from "./routes/instances.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK" });
});

app.use("/instances", instancesRouter);

app.get("/", (_req, res) => {
    res.send("Hello, World!");
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${port}`);
});
