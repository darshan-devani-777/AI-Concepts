import mongoose from "mongoose";

export async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "vectoreDB_demo"
    });
    console.log("🍃 MongoDB connected...");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
}
