// CryptoCrowe - Simple TradingView Widget Implementation

function initializeTradingViewChart(containerId = 'tradingview_main', symbol = 'BINANCE:BTCUSDT') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    // Add the widget HTML
    widgetContainer.innerHTML = `
        <div class="tradingview-widget-container__widget" style="height: calc(100% - 32px); width: 100%;"></div>
        <div class="tradingview-widget-copyright">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span class="blue-text">Track all markets on TradingView</span>
            </a>
        </div>
    `;

    container.appendChild(widgetContainer);

    // Create and inject the TradingView script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(10, 10, 10, 1)",
        "gridColor": "rgba(26, 26, 26, 0.06)",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
    });

    widgetContainer.querySelector('.tradingview-widget-container__widget').appendChild(script);
}

// Alternative: Use iframe for guaranteed compatibility
function initializeTradingViewIframe(containerId = 'tradingview_main', symbol = 'BTCUSDT') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }

    // Clear and set up container
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '400px';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.scrolling = 'no';
    iframe.allowTransparency = true;
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Use TradingView's embedded chart
    iframe.src = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_${Date.now()}&symbol=BINANCE%3A${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=cryptocrowe`;

    container.appendChild(iframe);
}

// Fallback: Create a simple price chart using Canvas
function createSimplePriceChart(containerId = 'priceChart') {
    const canvas = document.getElementById(containerId);
    if (!canvas || !canvas.getContext) {
        console.error('Canvas not found or not supported');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Generate sample price data
    const priceData = generatePriceData();

    // Draw chart
    drawCandlestickChart(ctx, priceData, canvas.width, canvas.height);
}

function generatePriceData() {
    const data = [];
    let basePrice = 45000;

    for (let i = 0; i < 50; i++) {
        const volatility = 500;
        const change = (Math.random() - 0.5) * volatility;
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({ open, high, low, close, volume: Math.random() * 1000000 });
        basePrice = close;
    }

    return data;
}

function drawCandlestickChart(ctx, data, width, height) {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const candleWidth = chartWidth / data.length * 0.8;
    const spacing = chartWidth / data.length * 0.2;

    // Find price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    data.forEach(candle => {
        minPrice = Math.min(minPrice, candle.low);
        maxPrice = Math.max(maxPrice, candle.high);
    });

    const priceRange = maxPrice - minPrice;
    const priceScale = chartHeight / priceRange;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        // Price labels
        const price = maxPrice - (priceRange / 5) * i;
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(`$${price.toFixed(0)}`, 5, y + 3);
    }

    // Draw candles
    data.forEach((candle, index) => {
        const x = padding + index * (candleWidth + spacing) + spacing / 2;
        const isGreen = candle.close >= candle.open;

        // Wick
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, padding + (maxPrice - candle.high) * priceScale);
        ctx.lineTo(x + candleWidth / 2, padding + (maxPrice - candle.low) * priceScale);
        ctx.stroke();

        // Body
        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
        const bodyTop = padding + (maxPrice - Math.max(candle.open, candle.close)) * priceScale;
        const bodyHeight = Math.abs(candle.close - candle.open) * priceScale || 1;
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    });

    // Draw title
    ctx.fillStyle = '#4dd0e1';
    ctx.font = 'bold 14px Inter';
    ctx.fillText('BTC/USDT', padding, padding - 10);

    // Draw current price
    const lastCandle = data[data.length - 1];
    ctx.fillStyle = lastCandle.close >= lastCandle.open ? '#10b981' : '#ef4444';
    ctx.font = 'bold 16px Inter';
    ctx.fillText(`$${lastCandle.close.toFixed(2)}`, width - 150, padding - 10);
}

// Export functions for global use
window.initializeTradingViewChart = initializeTradingViewChart;
window.initializeTradingViewIframe = initializeTradingViewIframe;
window.createSimplePriceChart = createSimplePriceChart;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Try to initialize TradingView chart
    const mainChart = document.getElementById('tradingview_main');
    if (mainChart) {
        console.log('Initializing TradingView chart...');
        initializeTradingViewChart('tradingview_main', 'BINANCE:BTCUSDT');
    }

    // Fallback to canvas chart if needed
    const canvasChart = document.getElementById('priceChart');
    if (canvasChart && !mainChart) {
        console.log('Using canvas chart fallback...');
        createSimplePriceChart('priceChart');
    }
});