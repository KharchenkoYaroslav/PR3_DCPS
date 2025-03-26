import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./db";
import { WeatherModel } from "./structures";

dotenv.config();

const filePath = path.join(__dirname, "..", "data", "weather_data.csv");

async function migrateData() {
    await connectDB();

    const data: any[] = [];
    let headerRows = 9; 
    let currentRow = 0;

    fs.createReadStream(filePath)
        .pipe(csvParser({
            headers: false, 
            skipLines: headerRows 
        }))
        .on("data", (row: any) => {
            currentRow++;
            console.log("Рядок:", row);

            if (!row[0] || !row[1]) {
                console.warn(`Пропущено рядок ${currentRow} через відсутність даних`);
                return;
            }

            const dateString = row[0];
            const year = parseInt(dateString.substring(0, 4));
            const month = parseInt(dateString.substring(4, 6)) - 1; 
            const day = parseInt(dateString.substring(6, 8));
            const hour = parseInt(dateString.substring(9, 11));
            const minute = parseInt(dateString.substring(11, 13));

            const date = new Date(year, month, day, hour, minute);

            const temperature = parseFloat(row[1]);

            if (isNaN(date.getTime())) {
                console.warn(`Некоректна дата в рядку ${currentRow}: ${row[0]}`);
                return;
            }

            if (isNaN(temperature)) {
                console.warn(`Некоректна температура в рядку ${currentRow}: ${row[1]}`);
                return;
            }

            data.push({
                date: date,
                temperature: temperature,
            });
        })
        .on("error", (error) => {
            console.error("Помилка при читанні файлу:", error);
        })
        .on("end", async () => {
            try {
                await WeatherModel.insertMany(data);
                console.log(`Завантажено ${data.length} записів у MongoDB`);
            } catch (error) {
                console.error("Помилка при завантаженні:", error);
            } finally {
                await mongoose.connection.close();
                process.exit();
            }
        });
}

migrateData().catch(console.error);

