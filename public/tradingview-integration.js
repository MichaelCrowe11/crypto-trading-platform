// CryptoCrowe - TradingView Advanced Charts Integration

class TradingViewChart {
    constructor(containerId, symbol = 'BINANCE:BTCUSDT') {
        this.containerId = containerId;
        this.symbol = symbol;
        this.widget = null;
        this.theme = 'dark';
        this.interval = 'D';
        this.studies = [];

        this.init();
    }

    init() {
        // Create the TradingView widget immediately using the embed approach
        this.createWidget();
    }

    createWidget() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create TradingView widget using iframe embed
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        // Use TradingView's lightweight embed
        widgetContainer.innerHTML = `
            <div id="tradingview_widget" style="height: 100%; width: 100%;"></div>
            <script type="text/javascript">
                (function() {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.async = true;
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
                    script.innerHTML = JSON.stringify({
                        "autosize": true,
                        "symbol": "${this.symbol}",
                        "interval": "${this.interval}",
                        "timezone": "Etc/UTC",
                        "theme": "dark",
                        "style": "1",
                        "locale": "en",
                        "enable_publishing": false,
                        "allow_symbol_change": true,
                        "container_id": "tradingview_widget",
                        "backgroundColor": "rgba(10, 10, 10, 1)",
                        "gridColor": "rgba(26, 26, 26, 0.5)",
                        "hide_side_toolbar": false,
                        "studies": [
                            "RSI@tv-basicstudies",
                            "MASimple@tv-basicstudies",
                            "MACD@tv-basicstudies"
                        ],
                        "show_popup_button": true,
                        "popup_width": "1000",
                        "popup_height": "650"
                    });
                    document.getElementById('tradingview_widget').appendChild(script);
                })();
            </script>
        `;

        container.appendChild(widgetContainer);

        // Add custom controls
        this.addCustomControls(container);
    }

    addCustomControls(container) {
        const controls = document.createElement('div');
        controls.className = 'tradingview-controls';
        controls.innerHTML = `
            <div class="chart-controls-wrapper">
                <div class="chart-timeframes">
                    <button class="timeframe-btn" data-interval="1">1m</button>
                    <button class="timeframe-btn" data-interval="5">5m</button>
                    <button class="timeframe-btn" data-interval="15">15m</button>
                    <button class="timeframe-btn" data-interval="30">30m</button>
                    <button class="timeframe-btn" data-interval="60">1H</button>
                    <button class="timeframe-btn" data-interval="240">4H</button>
                    <button class="timeframe-btn active" data-interval="D">1D</button>
                    <button class="timeframe-btn" data-interval="W">1W</button>
                </div>

                <div class="chart-indicators">
                    <button class="indicator-btn" onclick="tradingChart.toggleIndicator('MA')">
                        <i class="fas fa-chart-line"></i> MA
                    </button>
                    <button class="indicator-btn" onclick="tradingChart.toggleIndicator('RSI')">
                        <i class="fas fa-signal"></i> RSI
                    </button>
                    <button class="indicator-btn" onclick="tradingChart.toggleIndicator('MACD')">
                        <i class="fas fa-wave-square"></i> MACD
                    </button>
                    <button class="indicator-btn" onclick="tradingChart.toggleIndicator('BB')">
                        <i class="fas fa-expand"></i> BB
                    </button>
                    <button class="indicator-btn" onclick="tradingChart.toggleIndicator('VOL')">
                        <i class="fas fa-chart-bar"></i> VOL
                    </button>
                </div>

                <div class="chart-tools">
                    <button class="tool-btn" onclick="tradingChart.toggleDrawingMode()">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="tool-btn" onclick="tradingChart.takeSnapshot()">
                        <i class="fas fa-camera"></i>
                    </button>
                    <button class="tool-btn" onclick="tradingChart.toggleFullscreen()">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="tool-btn" onclick="tradingChart.resetChart()">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>

                <div class="chart-style">
                    <button class="style-btn active" onclick="tradingChart.setChartType('candles')">
                        <i class="fas fa-chart-candlestick"></i>
                    </button>
                    <button class="style-btn" onclick="tradingChart.setChartType('line')">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="style-btn" onclick="tradingChart.setChartType('area')">
                        <i class="fas fa-chart-area"></i>
                    </button>
                    <button class="style-btn" onclick="tradingChart.setChartType('bars')">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                </div>
            </div>
        `;

        container.insertBefore(controls, container.firstChild);

        // Add event listeners
        controls.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeTimeframe(btn.dataset.interval);

                // Update active state
                controls.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    changeSymbol(symbol) {
        this.symbol = symbol;
        this.createWidget();
    }

    changeTimeframe(interval) {
        this.interval = interval;
        this.createWidget();
    }

    setChartType(type) {
        const styleMap = {
            'candles': '1',
            'line': '2',
            'area': '3',
            'bars': '0'
        };

        if (this.widget) {
            // Recreate widget with new style
            this.style = styleMap[type] || '1';
            this.createWidget();
        }
    }

    toggleIndicator(indicator) {
        // Toggle indicator in studies array
        const indicatorMap = {
            'MA': 'MASimple@tv-basicstudies',
            'RSI': 'RSI@tv-basicstudies',
            'MACD': 'MACD@tv-basicstudies',
            'BB': 'BollingerBands@tv-basicstudies',
            'VOL': 'Volume@tv-basicstudies'
        };

        const study = indicatorMap[indicator];
        if (!study) return;

        const index = this.studies.indexOf(study);
        if (index > -1) {
            this.studies.splice(index, 1);
        } else {
            this.studies.push(study);
        }

        // Recreate widget with updated studies
        this.createWidget();
    }

    toggleDrawingMode() {
        // This would require advanced widget with drawing tools
        console.log('Drawing mode toggle - requires advanced widget');
    }

    takeSnapshot() {
        // Save chart image
        if (this.widget) {
            this.widget.takeScreenshot().then(imageData => {
                // Create download link
                const link = document.createElement('a');
                link.download = `cryptocrowe-chart-${Date.now()}.png`;
                link.href = imageData;
                link.click();
            });
        }
    }

    toggleFullscreen() {
        const container = document.getElementById(this.containerId);
        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    resetChart() {
        this.interval = 'D';
        this.studies = ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'];
        this.createWidget();
    }

    // Save chart state
    saveChartData() {
        if (this.widget) {
            this.widget.save(data => {
                localStorage.setItem('tradingview_chart_data', JSON.stringify(data));
            });
        }
    }

    // Load saved chart state
    loadChartData() {
        const savedData = localStorage.getItem('tradingview_chart_data');
        if (savedData && this.widget) {
            this.widget.load(JSON.parse(savedData));
        }
    }
}

// Lightweight chart option for smaller widgets
class LightweightChart {
    constructor(containerId, symbol = 'BTC/USD') {
        this.containerId = containerId;
        this.symbol = symbol;
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.ws = null;

        this.init();
    }

    async init() {
        // Load Lightweight Charts library
        if (!window.LightweightCharts) {
            await this.loadScript('https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js');
        }

        this.createChart();
        this.connectWebSocket();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createChart() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Create chart
        this.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 400,
            layout: {
                backgroundColor: '#0a0a0a',
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: {
                    color: 'rgba(42, 46, 57, 0.5)',
                },
                horzLines: {
                    color: 'rgba(42, 46, 57, 0.5)',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // Add candlestick series
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        // Add volume series
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        // Load initial data
        this.loadHistoricalData();

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight || 400,
            });
        });
    }

    async loadHistoricalData() {
        try {
            // Fetch from your API
            const response = await fetch(`/api/market/ohlcv/${this.symbol}?timeframe=1h&limit=100`);
            const data = await response.json();

            const candleData = data.map(d => ({
                time: d.timestamp / 1000,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));

            const volumeData = data.map(d => ({
                time: d.timestamp / 1000,
                value: d.volume,
                color: d.close >= d.open ? '#10b98122' : '#ef444422',
            }));

            this.candleSeries.setData(candleData);
            this.volumeSeries.setData(volumeData);

            // Fit content
            this.chart.timeScale().fitContent();
        } catch (error) {
            console.error('Failed to load chart data:', error);
            // Use mock data as fallback
            this.useMockData();
        }
    }

    useMockData() {
        const now = Date.now() / 1000;
        const candleData = [];
        const volumeData = [];

        let lastClose = 45000;

        for (let i = 100; i >= 0; i--) {
            const time = now - (i * 3600);
            const open = lastClose;
            const change = (Math.random() - 0.5) * 1000;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 500;
            const low = Math.min(open, close) - Math.random() * 500;
            const volume = Math.random() * 1000000;

            candleData.push({ time, open, high, low, close });
            volumeData.push({
                time,
                value: volume,
                color: close >= open ? '#10b98122' : '#ef444422'
            });

            lastClose = close;
        }

        this.candleSeries.setData(candleData);
        this.volumeSeries.setData(volumeData);
        this.chart.timeScale().fitContent();
    }

    connectWebSocket() {
        // Connect to price feed WebSocket
        this.ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const candle = data.k;

            const update = {
                time: candle.t / 1000,
                open: parseFloat(candle.o),
                high: parseFloat(candle.h),
                low: parseFloat(candle.l),
                close: parseFloat(candle.c),
            };

            const volumeUpdate = {
                time: candle.t / 1000,
                value: parseFloat(candle.v),
                color: update.close >= update.open ? '#10b98122' : '#ef444422',
            };

            this.candleSeries.update(update);
            this.volumeSeries.update(volumeUpdate);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.chart) {
            this.chart.remove();
        }
    }
}

// Initialize charts when needed
let tradingChart;
let miniCharts = {};

function initializeTradingView(containerId, symbol) {
    tradingChart = new TradingViewChart(containerId, symbol);
}

function initializeLightweightChart(containerId, symbol) {
    if (miniCharts[containerId]) {
        miniCharts[containerId].destroy();
    }
    miniCharts[containerId] = new LightweightChart(containerId, symbol);
}

// Add CSS for chart controls
const chartStyles = `
<style>
.tradingview-controls {
    background: rgba(10, 10, 10, 0.9);
    border-bottom: 1px solid rgba(77, 208, 225, 0.2);
    padding: 10px;
}

.chart-controls-wrapper {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
}

.chart-timeframes,
.chart-indicators,
.chart-tools,
.chart-style {
    display: flex;
    gap: 5px;
}

.timeframe-btn,
.indicator-btn,
.tool-btn,
.style-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.timeframe-btn:hover,
.indicator-btn:hover,
.tool-btn:hover,
.style-btn:hover {
    background: rgba(77, 208, 225, 0.1);
    border-color: rgba(77, 208, 225, 0.3);
    color: #4dd0e1;
}

.timeframe-btn.active,
.indicator-btn.active,
.style-btn.active {
    background: rgba(77, 208, 225, 0.2);
    border-color: #4dd0e1;
    color: #4dd0e1;
}

.chart-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
}

/* Responsive chart */
@media (max-width: 768px) {
    .chart-controls-wrapper {
        flex-direction: column;
        align-items: stretch;
    }

    .chart-timeframes,
    .chart-indicators,
    .chart-tools,
    .chart-style {
        justify-content: space-between;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', chartStyles);