import axios from "axios";
import * as cheerio from "cheerio";

export const fetchCheerio = async (
  URL,
  priceLocation,
  nameLocation,
  imageLocation,
  type
) => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(data);
    let name = $(nameLocation).text().trim();
    let price = $(priceLocation).text().replace(/([$,₹£A-Za-z])/g, "").trim();
    let image = type === "product" ? $(imageLocation).attr("src") : "";

    return { price, name, image };
  } catch (error) {
    throw error;
  }
};
