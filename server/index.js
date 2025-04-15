// index.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';

import checkPrices from './utils/priceChecker.js';
import productRoutes from './routes/productRoutes.js';
import predictRoutes from './routes/predictRoutes.js';

dotenv.config();

const app = express(); // ✅ Define `app` before using it
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Now register your routes
app.use('/api/products', productRoutes);
app.use('/api', predictRoutes);
app.use('/api/predict-drop', predictRoutes);


mongoose
  .connect(process.env.MONGO_URI, {
    dbName: 'price-tracker',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

cron.schedule("*/30 * * * *", () => {
  console.log("🔁 Running scheduled price check...");
  checkPrices();
});
