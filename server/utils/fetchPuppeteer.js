import puppeteer from "puppeteer";

export default async function fetchPuppeteer(url, priceLocation, nameLocation, imageLocation) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for product title to load as indicator that content is ready
    await page.waitForSelector(nameLocation, { timeout: 10000 });

    const data = await page.evaluate((priceLocation, nameLocation, imageLocation) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : null;
      };

      const getImage = () => {
        const imgEl = document.querySelector("img#landingImage");

        if (imgEl?.src) return imgEl.src;

        const dynAttr = imgEl?.getAttribute("data-a-dynamic-image");
        if (dynAttr) {
          try {
            const imgJson = JSON.parse(dynAttr);
            return Object.keys(imgJson)[0];
          } catch (err) {
            return null;
          }
        }

        return null;
      };

      const name = getText(nameLocation);
      const price = getText(priceLocation);
      const image = getImage();

      return { name, price, image };
    }, priceLocation, nameLocation, imageLocation);

    await browser.close();
    return data;
  } catch (error) {
    console.error("❌ Scraper error:", error.message);
    return { price: null, name: null, image: null };
  }
}
