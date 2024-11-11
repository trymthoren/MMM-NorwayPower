Module.register("MMM-NorwayPower", {
    defaults: {
        updateInterval: 3600000, // 1 hour
        region: "NO1",  // Oslo/Øst-Norge
        showGraph: true,
        showAverage: true,
        showHighLow: true,
        animationSpeed: 1000,
        priceUnit: "øre/kWh",
        coloredText: true,
        language: "en"
    },

    requiresVersion: "2.17.0",

    start: function() {
        Log.info("Starting module: " + this.name);
        this.loaded = false;
        this.prices = [];
        this.currentPrice = null;
        this.averagePrice = null;
        this.lowestPrice = null;
        this.highestPrice = null;
        
        this.getPrices();
        this.scheduleUpdate();
    },

    getStyles: function() {
        return ["MMM-NorwayPower.css"];
    },

    getTranslations: function() {
        return {
            en: {
                "CURRENT": "Current Price",
                "AVERAGE": "Today's Average",
                "LOWEST": "Lowest Today",
                "HIGHEST": "Highest Today",
                "LOADING": "Loading prices...",
                "NO_DATA": "No price data available"
            },
            nb: {
                "CURRENT": "Nåværende Pris",
                "AVERAGE": "Dagens Gjennomsnitt",
                "LOWEST": "Laveste I Dag",
                "HIGHEST": "Høyeste I Dag",
                "LOADING": "Laster priser...",
                "NO_DATA": "Ingen prisdata tilgjengelig"
            }
        };
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-NorwayPower";

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("LOADING");
            return wrapper;
        }

        if (!this.prices.length) {
            wrapper.innerHTML = this.translate("NO_DATA");
            return wrapper;
        }

        // Current price
        const currentHour = new Date().getHours();
        const priceDiv = document.createElement("div");
        priceDiv.className = "price-now";
        
        const currentPrice = this.prices[currentHour];
        const priceClass = this.getPriceClass(currentPrice);
        priceDiv.innerHTML = `${this.translate("CURRENT")}: <span class="${priceClass}">${currentPrice.toFixed(2)} ${this.config.priceUnit}</span>`;
        wrapper.appendChild(priceDiv);

        // Statistics
        if (this.config.showHighLow) {
            const statsDiv = document.createElement("div");
            statsDiv.className = "price-info";
            
            if (this.config.showAverage) {
                statsDiv.innerHTML += `${this.translate("AVERAGE")}: ${this.averagePrice.toFixed(2)} ${this.config.priceUnit}<br>`;
            }
            
            statsDiv.innerHTML += `${this.translate("LOWEST")}: <span class="price-low">${this.lowestPrice.toFixed(2)} ${this.config.priceUnit}</span><br>`;
            statsDiv.innerHTML += `${this.translate("HIGHEST")}: <span class="price-high">${this.highestPrice.toFixed(2)} ${this.config.priceUnit}</span>`;
            wrapper.appendChild(statsDiv);
        }

        // Graph
        if (this.config.showGraph) {
            const graphContainer = document.createElement("div");
            graphContainer.className = "graph-container";
            const canvas = document.createElement("canvas");
            graphContainer.appendChild(canvas);
            wrapper.appendChild(graphContainer);
            
            this.drawGraph(canvas);
        }

        return wrapper;
    },

    getPriceClass: function(price) {
        if (price <= this.averagePrice * 0.8) return "price-low";
        if (price >= this.averagePrice * 1.2) return "price-high";
        return "price-medium";
    },

    drawGraph: function(canvas) {
        const ctx = canvas.getContext("2d");
        const width = 300;
        const height = 100;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw graph
        if (this.prices.length) {
            const maxPrice = Math.max(...this.prices);
            const minPrice = Math.min(...this.prices);
            const range = maxPrice - minPrice;
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.beginPath();
            this.prices.forEach((price, i) => {
                const x = (i * width) / 24;
                const y = height - ((price - minPrice) * height) / range;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Mark current hour
            const currentHour = new Date().getHours();
            const x = (currentHour * width) / 24;
            ctx.strokeStyle = "#FF0000";
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getPrices();
        }, this.config.updateInterval);
    },

    getPrices: function() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        this.sendSocketNotification("GET_PRICES", {
            date: `${year}/${month}-${day}`,
            region: this.config.region
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "PRICES_RESULT") {
            this.prices = payload;
            this.loaded = true;
            
            // Calculate statistics
            this.averagePrice = this.prices.reduce((a, b) => a + b, 0) / this.prices.length;
            this.lowestPrice = Math.min(...this.prices);
            this.highestPrice = Math.max(...this.prices);
            
            this.updateDom(this.config.animationSpeed);
        }
    }
});
