// utils/priceChecker.js
import Product from '../models/Product.js';
import { getAmazonPrice } from './getAmazonPrice.js';
import sendEmail from './sendEmail.js';

const checkPrices = async () => {
  const products = await Product.find();

  for (let product of products) {
    const result = await getAmazonPrice(product.url);

    if (!result || typeof result.price !== 'number') {
      console.log(`⚠️ Failed to fetch price for ${product.name}`);
      continue;
    }

    const { price, imageUrl } = result;

    console.log(`✅ Checked ${product.name} | Current price: ₹${price}`);

    if (price <= product.desiredPrice && !product.notified) {
      await sendEmail(
        product.email,
        `🔥 Price Drop Alert: ${product.name}`,
        `The price has dropped to ₹${price}!\nCheck it here: ${product.url}`
      );
      product.notified = true;
    }

    product.currentPrice = price;
    product.imageUrl = imageUrl || product.imageUrl; // update only if available
    product.lastChecked = new Date();
    await product.save();
  }
};

export default checkPrices;
