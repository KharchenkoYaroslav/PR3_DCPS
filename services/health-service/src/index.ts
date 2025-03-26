import express from "express";
import axios from "axios";

const app = express();
const port = process.env.PORT || 4003;

const SERVICES = [
  { name: "Data Service", url: "http://data-service:4001/health" },
  { name: "AI Service", url: "http://ai-service:4002/health" }
];

app.get("/health", async (req, res) => {
  const results = await Promise.all(
    SERVICES.map(async (service) => {
      try {
        const response = await axios.get<{ status: string }>(service.url);
        return { name: service.name, status: response.data.status };
      } catch {
        return { name: service.name, status: "ERROR" };
      }
    })
  );

  const isHealthy = results.every((s) => s.status === "OK");
  res.status(isHealthy ? 200 : 500).json(results);
});

app.listen(port, () => console.log(`health-service працює на порті ${port}`));
