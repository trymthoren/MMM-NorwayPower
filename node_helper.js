const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
   start: function() {
       console.log("Starting node helper for: " + this.name);
   },

   getPrices: function(config) {
       const url = `https://www.hvakosterstrommen.no/api/v1/prices/${config.date}_${config.region}.json`;

       https.get(url, (res) => {
           let data = '';

           res.on('data', (chunk) => {
               data += chunk;
           });

           res.on('end', () => {
               try {
                   const jsonData = JSON.parse(data);
                   const prices = jsonData.map(hour => hour.NOK_per_kWh * 100);
                   this.sendSocketNotification("PRICES_RESULT", prices);
               } catch (error) {
                   console.error("Error parsing prices:", error);
               }
           });
       }).on('error', (error) => {
           console.error("Error fetching prices:", error);
       });
   },

   socketNotificationReceived: function(notification, payload) {
       if (notification === "GET_PRICES") {
           this.getPrices(payload);
       }
   }
});
