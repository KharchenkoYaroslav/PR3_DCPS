import axios from "axios";

const data_url = process.env.DATA_SERVICE_URL || "http://data-service:4001";
const ai_url = process.env.AI_SERVICE_URL || "http://ai-service:4002";
const YEAR = 2023;

async function testPredictionAccuracy(year: number) {
  try {
    console.log(`Перевіряємо точність передбачення для ${year} року...`);

    const realDataResponse = await axios.get(`${data_url}/weather/${year}`);
    const realData: { date: string; temperature: number }[] = realDataResponse.data as { date: string; temperature: number }[];

    if (realData.length === 0) {
      console.log(`Реальні дані для ${year} року відсутні.`);
      return;
    }

    const predictedDataResponse = await axios.get(`${ai_url}/predict?year=${year}`);
    const predictedData: { date: string; temperature: number }[] = predictedDataResponse.data as { date: string; temperature: number }[];

    if (predictedData.length === 0) {
        console.log(`Передбачення для ${year} року відсутні.`);
        return;
      }

    const realDataMap = new Map(realData.map(entry => [entry.date, entry.temperature]));

    let totalDifference = 0;
    let count = 0;

    predictedData.forEach(({ date, temperature }) => {
      if (realDataMap.has(date)) {
        const realTemp = realDataMap.get(date)!;
        const difference = temperature - realTemp;
        totalDifference += Math.abs(difference);
        count++;
      }
    });

    if (count === 0) {
      console.log(`Немає спільних дат для порівняння у ${year} році.`);
    } else {
      const averageDifference = totalDifference / count;
      console.log(`Середня абсолютна різниця: ${averageDifference.toFixed(2)}°C`);
    }
  } catch (error) {
    console.error("Помилка при тестуванні точності передбачення:", error);
  }
}

testPredictionAccuracy(YEAR);
