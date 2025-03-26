import express, { Request, Response, RequestHandler } from "express";
import { connectDB } from "./db";
import dotenv from "dotenv";
import cors from "cors";
import { WeatherModel } from "./structures";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;

(async () => {
  await connectDB();

  app.use(cors());

  app.get("/weather", async (req: Request, res: Response) => {
    try {
      console.log("Fetching all weather data...");
      const data = await WeatherModel.find({});
      res.json(data);
    } catch (error: any) {
      console.error("Помилка при отриманні даних:", error);
      res.status(500).send("Server error");
    }
  });

  app.get("/weather/:year", (async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year, 10);
      if (isNaN(year)) {
        console.log("Invalid year format");
        return res.status(400).send("Invalid year format");
      }

      const startDate = new Date(Date.UTC(year, 0, 1));
      const endDate = new Date(Date.UTC(year + 1, 0, 1));

      console.log("startDate:", startDate);
      console.log("endDate:", endDate);

      const data = await WeatherModel.find({
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      console.log("Data from DB:", data);

      if (data.length === 0) {
        console.log("No data found for this year");
        return res.status(404).send("No data found for this year");
      }

      res.json(data);
    } catch (error) {
      console.error("Помилка при отриманні даних:", error);
      res.status(500).send("Server error");
    }
  }) as RequestHandler);

  app.get("/latest", async (req: Request, res: Response) => {
    try {
      console.log("Fetching the latest weather data...");
      const latestData = await WeatherModel.findOne().sort({ date: -1 });
      console.log("Latest Weather Data:", latestData);
      res.json(latestData);
    } catch (error: any) {
      console.error("Помилка при отриманні даних:", error);
      res.status(500).send("Server error");
    }
  });

  app.get("/health", async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : "disconnected";

    try {
      const [weatherData, weatherYearData, latestData] = await Promise.all([
        WeatherModel.find({}).limit(1),
        WeatherModel.findOne({ date: { $exists: true } }),
        WeatherModel.findOne().sort({ date: -1 })
      ]);

      const isHealthy = dbState === 1 && weatherData.length > 0 && weatherYearData && latestData;

      res.status(isHealthy ? 200 : 500).json({
        status: isHealthy ? "OK" : "ERROR",
        service: "data-service",
        db: dbStatus,
        hooks: {
          "/weather": weatherData.length > 0 ? "OK" : "EMPTY",
          "/weather/:year": weatherYearData ? "OK" : "EMPTY",
          "/latest": latestData ? "OK" : "EMPTY"
        }
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Unknown error";

      console.error("Помилка healthCheck:", errMessage);
      res.status(500).json({
        status: "ERROR",
        service: "data-service",
        db: dbStatus,
        error: errMessage
      });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
})();