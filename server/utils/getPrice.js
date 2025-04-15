import puppeteer from "puppeteer";

export const getPNI = async (url) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait and select price
    await page.waitForSelector("span.a-price span.a-offscreen", { timeout: 10000 });
    const price = await page.$eval("span.a-price span.a-offscreen", el => el.innerText);

    // Optional image logic (you can comment or leave this for later)
    let image = "";
    try {
      image = await page.$eval(".imgTagWrapper img#landingImage", el => el.src);
    } catch (err) {
      console.warn("⚠️ Image not found");
    }

    // Optional name (for future use)
    let name = "";
    try {
      name = await page.$eval("span#productTitle", el => el.innerText.trim());
    } catch (err) {
      console.warn("⚠️ Name not found");
    }

    await browser.close();

    return {
      price: price.replace(/[₹,]/g, "").trim(),
      name,
      image
    };
  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    return { price: null, name: null, image: null };
  }
};
