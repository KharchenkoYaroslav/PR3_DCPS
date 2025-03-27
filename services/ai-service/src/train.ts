import axios from "axios";
import { RandomForestRegression as RF } from "ml-random-forest";
import fs from "fs";

const data_url = process.env.DATA_SERVICE_URL || "http://data-service:4001";

async function trainModel() {
  console.log("Завантаження історичних даних...");

  const response = await axios.get(`${data_url}/weather`);
  const data = response.data as { date: string; temperature: number }[];

  console.log(`Отримано ${data.length} записів`);

  const X = data.map(({ date }) => {
    const d = new Date(date);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 3600 * 24));
    const month = d.getUTCMonth() + 1;
    const hour = d.getUTCHours();

    return [
      Math.sin((2 * Math.PI * dayOfYear) / 365), 
      Math.cos((2 * Math.PI * dayOfYear) / 365), 
      Math.sin((2 * Math.PI * month) / 12), 
      Math.cos((2 * Math.PI * month) / 12),
      Math.sin((2 * Math.PI * hour) / 24), 
      Math.cos((2 * Math.PI * hour) / 24), 
    ];
  });

  const y = data.map(({ temperature }) => temperature);

  const options = {
    nEstimators: 200, 
    maxFeatures: 2, 
    minSamplesSplit: 2, 
  };

  console.log("Тренуємо Random Forest...");
  const model = new RF(options);
  model.train(X, y);

  fs.writeFileSync("random_forest_model.json", JSON.stringify(model.toJSON()));

  console.log("Модель збережено у random_forest_model.json");
}

trainModel().catch(console.error);
