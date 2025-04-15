import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { price } = req.body;

    if (!price) return res.status(400).json({ error: "Price is required" });

    // Simulate logic
    const lowestPrice = price * (0.90 + Math.random() * 0.05);
    const averagePrice = (price + lowestPrice) / 2;
    const gap = price - averagePrice;
    const dropRatio = gap / price;

    let dropChance = 0;
    if (dropRatio > 0.10) dropChance = 0.7;
    else if (dropRatio > 0.05) dropChance = 0.5;
    else dropChance = 0.2;

    const willDropSoon = dropChance > 0.5;

    res.json({ willDropSoon, dropChance });
  } catch (err) {
    console.error("❌ Prediction route error:", err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;
