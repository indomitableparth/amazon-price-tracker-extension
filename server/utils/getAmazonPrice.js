// import puppeteer from 'puppeteer';

// export const getAmazonPrice = async (url) => {
//   const selectors = {
//     price: "span.a-price span.a-offscreen",
//     image: "#imgTagWrapperId img",
//   };

//   try {
//     const browser = await puppeteer.launch({
//       headless: 'new',
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     });

//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

//     // Scrape price
//     const priceText = await page.$eval(selectors.price, el =>
//       el.textContent.trim()
//     );
//     // Convert ₹99,900.00 → 99900
//     const price = Math.round(parseFloat(priceText.replace(/[^\d.]/g, '')));

//     // Scrape image
//     const imageUrl = await page.$eval(selectors.image, el =>
//       el.getAttribute('src')
//     );

//     await browser.close();

//     return {
//       price,
//       imageUrl,
//     };
//   } catch (error) {
//     console.error("❌ getAmazonPrice Error:", error.message);
//     return null;
//   }
// };


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const getAmazonPrice = async (url) => {
  const selectors = {
    primaryPrice: '#corePrice_feature_div .a-offscreen',
    fallbackPrice: 'span.a-price span.a-offscreen',
    image: '#imgTagWrapperId img',
  };

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 🛡️ Fake headers to bypass Amazon bot checks
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scrape price with fallback
    let priceText = null;
    try {
      await page.waitForSelector(selectors.primaryPrice, { timeout: 5000 });
      priceText = await page.$eval(selectors.primaryPrice, el => el.textContent.trim());
    } catch {
      try {
        await page.waitForSelector(selectors.fallbackPrice, { timeout: 5000 });
        priceText = await page.$eval(selectors.fallbackPrice, el => el.textContent.trim());
      } catch {
        throw new Error("Price element not found on page");
      }
    }

    const price = Math.round(parseFloat(priceText.replace(/[^\d.]/g, '')));

    // Scrape image
    let imageUrl = null;
    try {
      imageUrl = await page.$eval(selectors.image, el => el.getAttribute('src'));
    } catch {
      imageUrl = null;
    }

    await browser.close();

    return {
      price,
      imageUrl,
    };
  } catch (error) {
    console.error("❌ getAmazonPrice Error:", error.message);
    return null;
  }
};

