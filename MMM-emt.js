/* Magic Mirror
 * Module: emt
 *
 * By Iñaki Reta Sabarrós https://github.com/jirsis
 * MIT Licensed.
 */

function createTable() {
    let table = document.createElement("table");
    //table.className = "small";
    return table;
}
function createRow(line, config) {
    let row = document.createElement("tr");

    row.appendChild( createIconCell() );
    row.appendChild( createLineCell(line.line) );
    if(config.showDestination){
        row.appendChild( createDestinationCell(line.destination) );
    }
    row.appendChild( createTimesCell(line.times, config.highlightInterval) );
    return row;
}
function createIconCell() {
    let iconCell = document.createElement("td");
    iconCell.className = "bus-icon ";
    let busIcon = document.createElement("i");
    busIcon.className = "fas fa-bus";
    iconCell.appendChild(busIcon);
    return iconCell;
}
function createLineCell(busNumber) {
    let lineCell = document.createElement("td");
    lineCell.className = "bright line ";
    lineCell.innerHTML = busNumber;
    return lineCell;
}
function createDestinationCell(destination) {
    let destinationCell = document.createElement("td");
    destinationCell.className = "bright destination";
    destinationCell.innerHTML = destination.toLowerCase();
    return destinationCell;
}

function createTimesCell(times, hl) {
    let timesCell = document.createElement("td");
    timesCell.className = "bright time";
    times.forEach( (time) => {
        let span = document.createElement("span");
        if (Math.floor(time/60) < hl[0] ) {
            span.className = "tonedown";
        } else if (Math.floor(time/60) <= hl[1] ) {
            span.className = "highlight";
        }
        span.innerHTML = time===999999?"+20m":Math.floor(time/60).toString()+"m";
        timesCell.appendChild(span);
    });
    return timesCell;
}


Module.register("MMM-emt", {
    defaults: {

        clientId: "",
        passKey: "",
        busStops: [2021],

        highlightInterval: [5, 10], 
        showDestination: true,

        apiBase: "https://openapi.emtmadrid.es/v1",

        animationSpeed: 2000,

        initialLoadDelay: 2500,
        updateInterval: 60 * 1000, //every 1 minute
    },

    requiresVersion: "2.1.0",

    getStyles: function() {
        return ["emt.css"];
    },
    getScripts: function() {
        return [
            'https://use.fontawesome.com/releases/v5.0.6/js/all.js'
        ];
    },

    start: function() {
        Log.log("Starting module: " + this.name);
        this.scheduleUpdate(this.config.initialLoadDelay);
        this.loaded = false;
    },

    updateEmt: function(){
        var self = this;
        this.busesInfo = {};

        fetch(`${this.config.apiBase}/mobilitylabs/user/login/`, { 
            method: 'GET',
            headers: new Headers({'X-ClientId': this.config.clientId, 'passKey': this.config.passKey})
        })
        .then((loginResponse) => {
            return loginResponse.json();
        })
        .then((data) =>{
            return data.data[0].accessToken;
        })
        .then((accessToken) => {
            var formatResponse = {
                "statistics":"N",
                "cultureInfo":"EN",
                "Text_StopRequired_YN":"Y",
                "Text_EstimationsRequired_YN":"Y",
                "Text_IncidencesRequired_YN":"Y",
                "DateTime_Referenced_Incidencies_YYYYMMDD":"20180823"
            }
            let busStopsRequests = self.config.busStops.map((stop) => {
                return fetch(`${self.config.apiBase}/transport/busemtmad/stops/${stop}/arrives/all/`, {
                    method: 'POST',
                    headers: new Headers({'accessToken': accessToken, 'content-type': 'application/json'}),
                    body: JSON.stringify(formatResponse),
                })
                .then((arrivedResponse) => {
                    return arrivedResponse.json();
                })
            });
            Promise.all(busStopsRequests).then((allResults) => {
                allResults.map(arrivalInfo => self.processEmtInformation(arrivalInfo.data[0].Arrive));
                self.scheduleUpdate(self.config.updateInterval);
            });
        });

    },

    getDom: function() {
        var wrapper = document.createElement("div");
        if (this.config.clientId === "") {
            return this.emtNotConfigurated(wrapper);
        }
        if (!this.loaded) {
            return this.emtNotLoaded(wrapper);
        }

        if(this.error){
            wrapper.innerHTML = this.name + ": "+this.error;
            wrapper.className = "dimmed light small";
            this.error = undefined;
            return wrapper;
        }

        //var buses = this.busesInfo.sort(function(a, b){ return a.eta-b.eta; });

        let buses = this.busesInfo;
        Log.log(buses);

        let table = createTable();

        for (let busline of Object.keys(buses)){
            Log.log(buses[busline]);
            let row = createRow(buses[busline], this.config);
            table.appendChild(row);
        }
        return table;
    },



    emtNotConfigurated: function(wrapper) {
        wrapper.innerHTML = "Please set the correct emt <i>clientId</i> in the config for module: " + this.name + ".";
        wrapper.className = "dimmed light small";
        return wrapper;
    },

    emtNotLoaded: function(wrapper) {
        wrapper.innerHTML = this.name + " "+this.translate("LOADING");
        wrapper.className = "dimmed light small";
        return wrapper;
    },

    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }
        var self = this;
        setTimeout(function() {
            self.updateEmt();
        }, nextLoad);
    },

    processEmtInformation: function(busStop) {
        for (bus of busStop){
            if (!this.busesInfo[bus.line]) {
                this.busesInfo[bus.line] = {
                    line: bus.line,
                    destination: bus.destination,
                    times: []
                };
            }
            this.busesInfo[bus.line].times.push(bus.estimateArrive);
        }
        this.show(this.config.animationSpeed, {lockString:this.identifier});
        this.loaded=true;
        this.updateDom(this.config.animationSpeed);
    },

    showError: function(errorDescription) {
        this.error = errorDescription;
        Log.info(errorDescription);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "BUS_STOP_EVENTS") {
            Log.log(payload);
        }
        this.updateDom(this.config.animationSpeed);
    },
});
