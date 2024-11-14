Module.register("MMM-NorwayPower", {
    defaults: {
        region: "NO1",
        updateInterval: 3600000,
        priceUnit: "øre/kWh",
        language: "en"
    },

    start: function() {
        console.log("Starting MMM-NorwayPower");
        this.loaded = false;
        this.prices = [];
        this.getPrices();
        this.scheduleUpdate();
    },

    getStyles: function() {
        return ["MMM-NorwayPower.css"];
    },

    getDom: function() {
        console.log("MMM-NorwayPower: Getting DOM, loaded:", this.loaded, "prices:", this.prices);
        
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-NorwayPower";

        if (!this.loaded) {
            wrapper.innerHTML = "Loading prices...";
            return wrapper;
        }

        if (!this.prices || !this.prices.length) {
            wrapper.innerHTML = "No price data";
            return wrapper;
        }

        // Current price
        const currentHour = new Date().getHours();
        const currentPrice = this.prices[currentHour];

        wrapper.innerHTML = `
            <div class="price-now">
                Current Price: ${currentPrice ? currentPrice.toFixed(2) : "N/A"} ${this.config.priceUnit}
            </div>
            <div class="price-info">
                Average: ${this.getAveragePrice().toFixed(2)} ${this.config.priceUnit}<br>
                Min: ${Math.min(...this.prices).toFixed(2)} ${this.config.priceUnit}<br>
                Max: ${Math.max(...this.prices).toFixed(2)} ${this.config.priceUnit}
            </div>
        `;

        return wrapper;
    },

    getAveragePrice: function() {
        if (!this.prices.length) return 0;
        return this.prices.reduce((a, b) => a + b, 0) / this.prices.length;
    },

    scheduleUpdate: function() {
        setInterval(() => {
            console.log("MMM-NorwayPower: Scheduling update");
            this.getPrices();
        }, this.config.updateInterval);
    },

    getPrices: function() {
        console.log("MMM-NorwayPower: Getting prices");
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
        console.log("MMM-NorwayPower: Received notification:", notification, "payload:", payload);
        if (notification === "PRICES_RESULT") {
            this.prices = payload;
            this.loaded = true;
            this.updateDom();
        }
    }
});
