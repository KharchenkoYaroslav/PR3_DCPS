import mongoose from "mongoose";

const WeatherSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    temperature: { type: Number, required: true }
});

export const WeatherModel = mongoose.model("weather_datas", WeatherSchema);