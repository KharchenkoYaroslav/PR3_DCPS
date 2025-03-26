import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI as string);
        console.log("Підключено до MongoDB");
    } catch (error) {
        console.error("Помилка підключення до MongoDB:", error);
        process.exit(1);
    }
};
