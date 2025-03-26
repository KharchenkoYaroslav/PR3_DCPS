import express, { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import { RandomForestRegression as RF } from "ml-random-forest";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4002;
const data_url = process.env.DATA_SERVICE_URL || "http://data-service:4001";

let model: RF;

if (fs.existsSync("random_forest_model.json") && fs.statSync("random_forest_model.json").isFile()) {
  model = RF.load(JSON.parse(fs.readFileSync("random_forest_model.json", "utf-8")));
  console.log("Модель Random Forest завантажено.");
} else {
  console.error("Помилка: Файл моделі не знайдено. Спочатку запустіть train.ts.");
  process.exit(0);
}

app.use(cors());

app.get("/predict", async (req: Request, res: Response) => {
  try {
    const latestResponse = await axios.get(`${data_url}/latest`);
    const latestDate = new Date((latestResponse.data as { date: string }).date);

    const year = req.query.year ? parseInt(req.query.year as string) : latestDate.getUTCFullYear();

    console.log(`Передбачаємо погоду на ${year} рік...`);

    let currentDate = new Date(year, 0, 1, 0);
    const predictions = [];

    while (currentDate.getUTCFullYear() === year) {
      const dayOfYear = Math.floor((currentDate.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 3600 * 24));
      const month = currentDate.getUTCMonth() + 1;
      const hour = currentDate.getUTCHours();

      const sinDay = Math.sin((2 * Math.PI * dayOfYear) / 365);
      const cosDay = Math.cos((2 * Math.PI * dayOfYear) / 365);
      const sinMonth = Math.sin((2 * Math.PI * month) / 12);
      const cosMonth = Math.cos((2 * Math.PI * month) / 12);
      const sinHour = Math.sin((2 * Math.PI * hour) / 24);
      const cosHour = Math.cos((2 * Math.PI * hour) / 24);

      const predictedTemp = model.predict([[sinDay, cosDay, sinMonth, cosMonth, sinHour, cosHour]])[0];

      predictions.push({
        date: currentDate.toISOString(),
        temperature: predictedTemp,
      });

      currentDate.setUTCHours(currentDate.getUTCHours() + 1);
    }

    res.json(predictions);
  } catch (error) {
    console.error("Помилка при передбаченні:", error);
    res.status(500).send("Помилка сервера");
  }
});

app.get("/health", async (req, res) => {
  let predictStatus = "ERROR";

  if (model) {
    try {
      const response = await axios.get(`http://localhost:${port}/predict?year=2023`);
      const predictions = response.data as { date: string; temperature: number }[];

      if (Array.isArray(predictions) && predictions.length > 0) {
        predictStatus = "OK";
      }
    } catch (error) {
      console.error("Помилка при перевірці predict:", error);
    }
  }

  const isHealthy = model && predictStatus === "OK";

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? "OK" : "ERROR",
    service: "ai-service",
    model: model ? "loaded" : "not loaded",
    hooks: {
      "/predict": predictStatus,
    },
  });
});


app.listen(port, () => {
  console.log(`AI-сервер працює на порту ${port}`);
});