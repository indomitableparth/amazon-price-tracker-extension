import express from 'express';
import Product from '../models/Product.js';
import { getAmazonPrice } from '../utils/getAmazonPrice.js';
import sendEmail from '../utils/sendEmail.js';
import { predictPriceDrop } from '../utils/pricePredictor.js';
import { upcomingSales } from '../utils/saleDates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, url, desiredPrice, email } = req.body;

    const result = await getAmazonPrice(url);
    if (!result || !result.price) {
      return res.status(500).json({ error: '❌ Failed to scrape product info' });
    }

    const { price, imageUrl } = result;

    const product = new Product({
      name,
      url,
      desiredPrice,
      currentPrice: price,
      imageUrl: imageUrl || "https://via.placeholder.com/150",
      lastChecked: new Date(),
      email,
      notified: false,
    });

    await product.save();

    if (price <= desiredPrice && email) {
      await sendEmail(
        email,
        `🔥 Price Drop Alert: ${name}`,
        `The price has dropped to ₹${price}!\nCheck it here: ${url}`
      );
      product.notified = true;
      await product.save();
    }

    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error in POST /products:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ lastChecked: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error in GET /products:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    console.error('❌ Error in DELETE /products/:id:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ✅ NEW: Refresh all product prices with drop prediction
router.put('/refresh', async (req, res) => {
  try {
    const products = await Product.find();

    for (const product of products) {
      const result = await getAmazonPrice(product.url);
      if (result && result.price) {
        product.currentPrice = result.price;
        product.lastChecked = new Date();

        product.priceHistory.push({
          price: result.price,
          checkedAt: new Date(),
        });

        // 🔮 Predict price drop chance
        const lowestPrice = result.price * (0.90 + Math.random() * 0.05);
        const averagePrice = (result.price + lowestPrice) / 2;
        const priceGap = result.price - averagePrice;
        const dropRatio = priceGap / result.price;

        let advice = "";
        let dropChance = 0;

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

        product.predictedDrop = dropChance > 0.5;

        console.log(`🔮 ${product.name} → dropChance: ${dropChance}, advice: ${advice}`);

        // 💡 Sale Date Logic
        const today = new Date();
        const nearbySale = upcomingSales.find(sale => {
          const saleDate = new Date(sale.date);
          const diffInDays = (saleDate - today) / (1000 * 60 * 60 * 24);
          return diffInDays >= 0 && diffInDays <= 10;
        });

        if (nearbySale) {
          product.saleAdvice = `💡 ${nearbySale.name} is coming soon! Consider waiting for a drop.`;
        } else {
          product.saleAdvice = "";
        }

        // ✅ Re-check email notify condition
        if (
          result.price <= product.desiredPrice &&
          product.email &&
          !product.notified
        ) {
          await sendEmail(
            product.email,
            `🔥 Price Drop Alert: ${product.name}`,
            `The price has dropped to ₹${result.price}!\nCheck it here: ${product.url}`
          );
          product.notified = true;
        }

        await product.save();
      }
    }

    res.status(200).json({ message: "🔁 Prices refreshed successfully!" });
  } catch (err) {
    console.error("❌ Error in PUT /products/refresh:", err.message);
    res.status(500).json({ error: "Failed to refresh prices" });
  }
});


export default router;


// import express from 'express';
// import Product from '../models/Product.js';
// import { getAmazonPrice } from '../utils/getAmazonPrice.js';
// import sendEmail from '../utils/sendEmail.js';
// import { predictPriceDrop } from '../utils/pricePredictor.js';


// const router = express.Router();

// router.post('/', async (req, res) => {
//   try {
//     const { name, url, desiredPrice, email } = req.body;

//     const result = await getAmazonPrice(url);
//     if (!result || !result.price) {
//       return res.status(500).json({ error: '❌ Failed to scrape product info' });
//     }

//     const { price, imageUrl } = result;

//     const product = new Product({
//       name,
//       url,
//       desiredPrice,
//       currentPrice: price,
//       imageUrl: imageUrl || "https://via.placeholder.com/150",
//       lastChecked: new Date(),
//       email,
//       notified: false,
//     });

//     await product.save();

//     if (price <= desiredPrice && email) {
//       await sendEmail(
//         email,
//         `🔥 Price Drop Alert: ${name}`,
//         `The price has dropped to ₹${price}!\nCheck it here: ${url}`
//       );
//       product.notified = true;
//       await product.save();
//     }

//     res.status(201).json(product);
//   } catch (err) {
//     console.error("❌ Error in POST /products:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get('/', async (req, res) => {
//   try {
//     const products = await Product.find().sort({ lastChecked: -1 });
//     res.json(products);
//   } catch (err) {
//     console.error("❌ Error in GET /products:", err.message);
//     res.status(500).json({ error: "Failed to fetch products" });
//   }
// });

// router.delete('/:id', async (req, res) => {
//   try {
//     const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//     if (!deletedProduct) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
//     res.status(200).json({ message: 'Product deleted' });
//   } catch (err) {
//     console.error('❌ Error in DELETE /products/:id:', err.message);
//     res.status(500).json({ error: 'Failed to delete product' });
//   }
// });
// // ✅ NEW: Refresh all product prices
// router.put('/refresh', async (req, res) => {
//   try {
//     const products = await Product.find();

//     for (const product of products) {
//       const result = await getAmazonPrice(product.url);
//       if (result && result.price) {
//         product.currentPrice = result.price;
//         product.lastChecked = new Date();

//         product.priceHistory.push({
//           price: result.price,
//           checkedAt: new Date(),
//         });

//         // 🔮 Predict price drop chance based on avg/lowest simulation
//         const lowestPrice = result.price * (0.90 + Math.random() * 0.05);
//         const averagePrice = (result.price + lowestPrice) / 2;
//         const priceGap = result.price - averagePrice;
//         const dropRatio = priceGap / result.price;

//         let advice = "";
//         let dropChance = 0;

//         if (dropRatio > 0.10) {
//           dropChance = 0.7;
//           advice = "High chance of price drop. Wait.";
//         } else if (dropRatio > 0.05) {
//           dropChance = 0.5;
//           advice = "Moderate chance. Maybe wait.";
//         } else {
//           dropChance = 0.2;
//           advice = "Low chance. Buy now!";
//         }

//         product.predictedDrop = dropChance > 0.5;

//         console.log(`🔮 ${product.name} → dropChance: ${dropChance}, advice: ${advice}`);

//         // ✅ Re-check notification condition
//         if (
//           result.price <= product.desiredPrice &&
//           product.email &&
//           !product.notified
//         ) {
//           await sendEmail(
//             product.email,
//             `🔥 Price Drop Alert: ${product.name}`,
//             `The price has dropped to ₹${result.price}!\nCheck it here: ${product.url}`
//           );
//           product.notified = true;
//         }

//         await product.save();
//       }
//     }

//     res.status(200).json({ message: "🔁 Prices refreshed successfully!" });
//   } catch (err) {
//     console.error("❌ Error in PUT /products/refresh:", err.message);
//     res.status(500).json({ error: "Failed to refresh prices" });
//   }
// });
// export default router;


// ✅ old worknig: Refresh all product prices
// router.put('/refresh', async (req, res) => {
//   try {
//     const products = await Product.find();

//     for (const product of products) {
//       const result = await getAmazonPrice(product.url);
//       if (result && result.price) {
//         product.currentPrice = result.price;
//         product.lastChecked = new Date();

//         product.priceHistory.push({
//           price: result.price,
//           checkedAt: new Date(),
//         });
        

//         // Re-check notification condition
//         if (
//           result.price <= product.desiredPrice &&
//           product.email &&
//           !product.notified
//         ) {
//           await sendEmail(
//             product.email,
//             `🔥 Price Drop Alert: ${product.name}`,
//             `The price has dropped to ₹${result.price}!\nCheck it here: ${product.url}`
//           );
//           product.notified = true;
//         }

//         await product.save();
//       }
//     }

//     res.status(200).json({ message: "🔁 Prices refreshed successfully!" });
//   } catch (err) {
//     console.error("❌ Error in PUT /products/refresh:", err.message);
//     res.status(500).json({ error: "Failed to refresh prices" });
//   }
// });

// export default router;


// import express from 'express';
// import Product from '../models/Product.js';
// import { getAmazonPrice } from '../utils/getAmazonPrice.js';
// import sendEmail from '../utils/sendEmail.js';
// import { predictPriceDrop } from '../utils/pricePredictor.js'; // 🧠 NEW

// const router = express.Router();

// // 📌 Track a new product
// router.post('/', async (req, res) => {
//   try {
//     const { name, url, desiredPrice, email } = req.body;

//     const result = await getAmazonPrice(url);
//     if (!result || !result.price) {
//       return res.status(500).json({ error: '❌ Failed to scrape product info' });
//     }

//     const { price, imageUrl } = result;

//     const product = new Product({
//       name,
//       url,
//       desiredPrice,
//       currentPrice: price,
//       imageUrl: imageUrl || "https://via.placeholder.com/150",
//       lastChecked: new Date(),
//       email,
//       notified: false,
//     });

//     await product.save();

//     // 📧 Send email if already below desired price
//     if (price <= desiredPrice && email) {
//       await sendEmail(
//         email,
//         `🔥 Price Drop Alert: ${name}`,
//         `The price has dropped to ₹${price}!\nCheck it here: ${url}`
//       );
//       product.notified = true;
//       await product.save();
//     }

//     res.status(201).json(product);
//   } catch (err) {
//     console.error("❌ Error in POST /products:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 📌 Get all tracked products
// router.get('/', async (req, res) => {
//   try {
//     const products = await Product.find().sort({ lastChecked: -1 });
//     res.json(products);
//   } catch (err) {
//     console.error("❌ Error in GET /products:", err.message);
//     res.status(500).json({ error: "Failed to fetch products" });
//   }
// });

// // 📌 Delete a tracked product
// router.delete('/:id', async (req, res) => {
//   try {
//     const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//     if (!deletedProduct) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
//     res.status(200).json({ message: 'Product deleted' });
//   } catch (err) {
//     console.error('❌ Error in DELETE /products/:id:', err.message);
//     res.status(500).json({ error: 'Failed to delete product' });
//   }
// });

// // 📌 Refresh prices for all products
// router.put('/refresh', async (req, res) => {
//   try {
//     const products = await Product.find();

//     for (const product of products) {
//       const result = await getAmazonPrice(product.url);
//       if (result && result.price) {
//         product.currentPrice = result.price;
//         product.lastChecked = new Date();

//         product.priceHistory.push({
//           price: result.price,
//           checkedAt: new Date(),
//         });

//         // 🔮 Prediction Feature (NEW)
//         const isPredictedToDrop = predictPriceDrop(product.priceHistory);
//         product.predictedDrop = isPredictedToDrop;
//         if (isPredictedToDrop) {
//           console.log(`📉 [Prediction] Price may drop soon for: ${product.name}`);
//         }
//         await product.save();

//         // 📧 Notify if target reached
//         if (
//           result.price <= product.desiredPrice &&
//           product.email &&
//           !product.notified
//         ) {
//           await sendEmail(
//             product.email,
//             `🔥 Price Drop Alert: ${product.name}`,
//             `The price has dropped to ₹${result.price}!\nCheck it here: ${product.url}`
//           );
//           product.notified = true;
//         }

//         await product.save();
//       }
//     }

//     res.status(200).json({ message: "🔁 Prices refreshed successfully!" });
//   } catch (err) {
//     console.error("❌ Error in PUT /products/refresh:", err.message);
//     res.status(500).json({ error: "Failed to refresh prices" });
//   }
// });

// export default router;
