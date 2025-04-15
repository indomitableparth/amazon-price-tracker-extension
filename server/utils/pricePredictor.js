export const predictPriceDrop = (history, threshold = 0.95) => {
    if (history.length < 2) return false;
  
    const latestPrice = history[history.length - 1].price;
    const previousPrice = history[history.length - 2].price;
  
    const trend = latestPrice / previousPrice;
  
    return trend < threshold;
  };
  