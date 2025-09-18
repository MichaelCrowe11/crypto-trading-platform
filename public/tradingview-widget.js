// CryptoCrowe - Working TradingView Widget Implementation

function createTradingViewWidget(containerId = 'tradingview_main', symbol = 'BINANCE:BTCUSDT') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Set container styles
    container.style.height = '100%';
    container.style.minHeight = '400px';

    // Create unique widget ID
    const widgetId = `tradingview_${Date.now()}`;

    // Add TradingView widget container and script
    container.innerHTML = `
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container" style="height: 100%; width: 100%;">
            <div id="${widgetId}" style="height: calc(100% - 32px); width: 100%;"></div>
            <div class="tradingview-widget-copyright">
                <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                    <span class="blue-text">Track all markets on TradingView</span>
                </a>
            </div>
        </div>
        <!-- TradingView Widget END -->
    `;

    // Create and append the configuration script
    const scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.innerHTML = `
        (function() {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

            // Widget configuration
            script.innerHTML = JSON.stringify({
                "autosize": true,
                "symbol": "${symbol}",
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "enable_publishing": false,
                "backgroundColor": "rgba(10, 10, 10, 1)",
                "hide_side_toolbar": false,
                "allow_symbol_change": true,
                "container_id": "${widgetId}"
            });

            document.getElementById('${widgetId}').appendChild(script);
        })();
    `;

    container.appendChild(scriptElement);
}

// Alternative: Simple iframe implementation (guaranteed to work)
function createTradingViewIframe(containerId = 'tradingview_main', symbol = 'BTCUSDT') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Set container styles
    container.style.height = '100%';
    container.style.minHeight = '400px';
    container.style.position = 'relative';

    // Create iframe with TradingView embed
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.scrolling = 'no';
    iframe.allowTransparency = true;
    iframe.frameBorder = '0';

    // Use TradingView's embed URL
    iframe.src = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_${Date.now()}&symbol=BINANCE%3A${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%23000000%22%2C%22paneProperties.vertGridProperties.color%22%3A%22%231a1a1a%22%2C%22paneProperties.horzGridProperties.color%22%3A%22%231a1a1a%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`;

    container.appendChild(iframe);
}

// Lightweight alternative using TradingView mini chart
function createTradingViewMiniChart(containerId = 'tradingview_main', symbol = 'BINANCE:BTCUSDT') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create mini chart widget
    container.innerHTML = `
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container" style="height: 100%; width: 100%;">
            <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%;"></div>
        </div>
        <!-- TradingView Widget END -->
    `;

    // Add the mini chart script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
        "symbol": symbol,
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "dateRange": "1M",
        "colorTheme": "dark",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": ""
    });

    container.querySelector('.tradingview-widget-container__widget').appendChild(script);
}

// Function to initialize the best available chart
function initializeChart(containerId = 'tradingview_main', symbol = 'BINANCE:BTCUSDT') {
    console.log('Initializing TradingView chart for:', symbol);

    // Try the iframe method first (most reliable)
    try {
        createTradingViewIframe(containerId, symbol.replace('BINANCE:', ''));
        console.log('TradingView iframe chart initialized');
    } catch (error) {
        console.error('Failed to create TradingView iframe:', error);
        // Fallback to widget
        try {
            createTradingViewWidget(containerId, symbol);
            console.log('TradingView widget initialized');
        } catch (widgetError) {
            console.error('Failed to create TradingView widget:', widgetError);
            // Final fallback to mini chart
            createTradingViewMiniChart(containerId, symbol);
            console.log('TradingView mini chart initialized');
        }
    }
}

// Export functions for global use
window.createTradingViewWidget = createTradingViewWidget;
window.createTradingViewIframe = createTradingViewIframe;
window.createTradingViewMiniChart = createTradingViewMiniChart;
window.initializeChart = initializeChart;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Look for chart containers
    const mainChart = document.getElementById('tradingview_main');
    const priceChart = document.getElementById('priceChart');

    if (mainChart) {
        initializeChart('tradingview_main', 'BINANCE:BTCUSDT');
    } else if (priceChart) {
        // Create a container for TradingView inside the canvas element's parent
        priceChart.innerHTML = '<div id="tradingview_main" style="height: 100%; width: 100%;"></div>';
        initializeChart('tradingview_main', 'BINANCE:BTCUSDT');
    }
});

// Function to change chart symbol
window.changeChartSymbol = function(symbol) {
    console.log('Changing chart to:', symbol);
    initializeChart('tradingview_main', symbol);
};

// Function to select market and update chart
window.selectMarket = function(symbol) {
    console.log('Market selected:', symbol);
    // Update chart
    changeChartSymbol(`BINANCE:${symbol}`);
    // Update other UI elements if needed
    const titleElement = document.querySelector('.panel-title');
    if (titleElement && titleElement.textContent.includes('/')) {
        titleElement.textContent = symbol;
    }
};