import express from 'express';

const router = express.Router();

router.post('/drop', async (req, res) => {
  try {
    const { currentPrice } = req.body;
    if (!currentPrice) return res.status(400).json({ error: "Missing currentPrice" });

    const lowestPrice = currentPrice * (0.90 + Math.random() * 0.05);
    const averagePrice = (currentPrice + lowestPrice) / 2;
    const priceGap = currentPrice - averagePrice;
    const dropRatio = priceGap / currentPrice;

    let dropChance = 0;
    let advice = "";

    if (dropRatio > 0.10) {
      dropChance = 0.7;
      advice = "High chance of price drop. Wait.";
    } else if (dropRatio > 0.05) {
      dropChance = 0.5;
      advice = "Moderate chance. Maybe wait.";
    } else {
      dropChance = 0.2;
      advice = "Low chance. Buy now!";
    }

    res.json({ dropChance, advice });
  } catch (err) {
    console.error("❌ Prediction error:", err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;
