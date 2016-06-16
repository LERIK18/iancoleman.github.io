new (function() {

    // Notes: In some cases a month is 31 days since we need to accout for
    // worst case scenario, in others a month is 365/12 days.

    var self = this;

    var oneDay = 60*60*24;
    var oneYear = oneDay*365;
    var daysPerMonth = 365/12;

    var DOM = {};
    // Parameters
    DOM.size = select(".parameters .block-size");
    DOM.blocks = select(".parameters .blocks");
    DOM.blockGrammar = select(".parameters .block-grammar");
    DOM.time = select(".parameters .time");
    DOM.peers = select(".parameters .peers");
    DOM.nodes = select(".parameters .nodes");
    DOM.hops = select(".parameters .hops");
    // Results
    DOM.bandwidthTotal = select(".results .bandwidth .total");
    DOM.bandwidthDown = select(".results .bandwidth .down");
    DOM.bandwidthUp = select(".results .bandwidth .up");
    DOM.dataCap = select(".results .data-cap");
    DOM.suppliedDiskCapacity = select(".results .disk-consumption");
    DOM.processing = select(".results .processing");
    // Costs
    DOM.bandwidthCostRow = select(".costs .bandwidth");
    DOM.bandwidthErrorMsg = select(".costs .bandwidth .error");
    DOM.bandwidthType = select(".costs .bandwidth .type");
    DOM.bandwidthCostPercent = select(".costs .bandwidth .percent .value");
    DOM.bandwidthCostBar = select(".costs .bandwidth .bar");
    DOM.unlimited = select(".costs .unlimited");
    DOM.unlimitedPrice = select(".costs .unlimited .price");
    DOM.unlimitedTime = select(".costs .unlimited .time");
    DOM.unlimitedSpeed = select(".costs .unlimited .speed");
    DOM.capped = select(".costs .capped");
    DOM.cappedSize = select(".costs .capped .size");
    DOM.cappedTime = select(".costs .capped .time");
    DOM.cappedPrice = select(".costs .capped .price");
    DOM.cappedSpeed = select(".costs .capped .speed");
    DOM.bandwidthCost = select(".costs .bandwidth .total");
    DOM.staleRate = select(".costs .stale-rate");
    DOM.diskSize = select(".costs .disk .size");
    DOM.diskPrice = select(".costs .disk .price");
    DOM.diskCost = select(".costs .disk .total");
    DOM.diskCostPercent = select(".costs .disk .percent .value");
    DOM.diskCostBar = select(".costs .disk .bar");
    DOM.finalTotal = select(".costs .final .total");
    DOM.processingCostRow = select(".costs .processing");
    DOM.processingErrorMsg = select(".costs .processing .error");
    DOM.processingPrice = select(".processing .price");
    DOM.processingRate = select(".processing .rate");
    DOM.processingCost = select(".processing .total");
    DOM.processingCostPercent = select(".costs .processing .percent .value");
    DOM.processingCostBar = select(".costs .processing .bar");
    DOM.laborHours = select(".labor .hours");
    DOM.laborPrice = select(".labor .price");
    DOM.laborCost = select(".labor .total");
    DOM.laborCostPercent = select(".costs .labor .percent .value");
    DOM.laborCostBar = select(".costs .labor .bar");

    function init() {
        setEvents();
        render();
    }

    function setEvents() {
        var onInputEls = [
            DOM.size,
            DOM.blocks,
            DOM.time,
            DOM.unlimitedPrice,
            DOM.unlimitedTime,
            DOM.unlimitedSpeed,
            DOM.cappedSize,
            DOM.cappedTime,
            DOM.cappedPrice,
            DOM.cappedSpeed,
            DOM.diskSize,
            DOM.diskPrice,
            DOM.processingPrice,
            DOM.processingRate,
            DOM.laborHours,
            DOM.laborPrice,
            DOM.peers,
            DOM.nodes,
        ];
        var onChangeEls = [
            DOM.bandwidthType,
            DOM.cappedTime,
            DOM.unlimitedTime,
        ];
        for (var i=0; i<onInputEls.length; i++) {
            onInputEls[i].addEventListener("input", render);
        }
        for (var i=0; i<onChangeEls.length; i++) {
            onChangeEls[i].addEventListener("change", render);
        }
    }

    function render() {
        // parameters
        var megabytesPerBlock = parseFloat(DOM.size.value);
        var blocks = parseFloat(DOM.blocks.value);
        var time = parseFloat(DOM.time.value);
        var peers = parseFloat(DOM.peers.value);
        var nodes = parseFloat(DOM.nodes.value);
        // grammar
        if (blocks == 1) {
            DOM.blockGrammar.textContent = "block";
        }
        else {
            DOM.blockGrammar.textContent = "blocks";
        }
        // calculations
        // hops
        var hops = numberOfHops(nodes, peers);
        // results
        // bandwidth - assumes full block downloaded before sending to next hop
        var megabitsPerBlock = megabytesPerBlock * 8;
        var blocksPerSecond = blocks / time;
        var megabitsPerSecondDown = megabitsPerBlock * blocksPerSecond * hops;
        var megabitsPerSecondUp = megabitsPerBlock * blocksPerSecond * (peers - 1) * hops;
        var megabitsPerSecondTotal = megabitsPerSecondUp + megabitsPerSecondDown;
        // data cap
        var secondsPerMonth = 60*60*24*31;
        var blocksPerMonth = secondsPerMonth * blocksPerSecond;
        var megabytesPerMonth = blocksPerMonth * megabytesPerBlock * peers;
        var gigabytesPerMonth = megabytesPerMonth / 1000;
        // supplied disk capacity
        var secondsPerYear = 60*60*24*365;
        var blocksPerYear = secondsPerYear * blocksPerSecond;
        var megabytesPerYear = blocksPerYear * megabytesPerBlock;
        var gigabytesPerYear = megabytesPerYear / 1000;
        // processing
        var minTxSize = 226; // bytes
        var bytesPerBlock = megabytesPerBlock * 1000 * 1000;
        var txsPerBlock = bytesPerBlock / minTxSize;
        var txsPerSecond = txsPerBlock * blocksPerSecond;
        // costs
        var finalTotal = 0;
        var bandwidthType = DOM.bandwidthType.value;
        var bandwidthCost = 0;
        var staleRate = 0;
        // bandwidth cost options
        DOM.unlimited.classList.add("hidden");
        DOM.capped.classList.add("hidden");
        if (bandwidthType == "unlimited") {
            // show unlimited options
            DOM.unlimited.classList.remove("hidden");
            // validate numbers
            var availableSpeed = parseFloat(DOM.unlimitedSpeed.value);
            // if impossible, show error
            if (availableSpeed < megabitsPerSecondTotal) {
                DOM.unlimitedSpeed.classList.add("impossible");
                DOM.bandwidthErrorMsg.classList.remove("hidden");
            }
            else {
                DOM.unlimitedSpeed.classList.remove("impossible");
                DOM.bandwidthErrorMsg.classList.add("hidden");
            }
            // calculate stale rate
            var secondsToGetBlock = megabitsPerBlock / availableSpeed;
            staleRate = chanceOfNewBlock(secondsToGetBlock, time);
            // calculate annual cost
            var consumptionRatio = megabitsPerSecondTotal / availableSpeed;
            var unitPrice = parseFloat(DOM.unlimitedPrice.value);
            var timeUnits = parseFloat(DOM.unlimitedTime.value);
            var unitsEachYear = oneYear / timeUnits;
            bandwidthCost = unitsEachYear * unitPrice * consumptionRatio;
        }
        else if (bandwidthType == "capped") {
            // show capped options
            DOM.capped.classList.remove("hidden");
            // validate numbers
            var availableSize = parseFloat(DOM.cappedSize.value);
            var timeUnits = parseFloat(DOM.cappedTime.value);
            var unitsEachDay = oneDay / timeUnits;
            var availableEachDay = unitsEachDay * availableSize;
            var availableEachMonth = availableEachDay * daysPerMonth;
            var availableSpeed = parseFloat(DOM.cappedSpeed.value);
            // if impossible, show error
            var impossibleSize = availableEachMonth < gigabytesPerMonth;
            var impossibleSpeed = availableSpeed < megabitsPerSecondTotal;
            if (impossibleSize || impossibleSpeed) {
                DOM.bandwidthErrorMsg.classList.remove("hidden");
            }
            else {
                DOM.bandwidthErrorMsg.classList.add("hidden");
            }
            if (impossibleSize) {
                DOM.cappedSize.classList.add("impossible");
            }
            else {
                DOM.cappedSize.classList.remove("impossible");
            }
            if (impossibleSpeed) {
                DOM.cappedSpeed.classList.add("impossible");
            }
            else {
                DOM.cappedSpeed.classList.remove("impossible");
            }
            // calculate stale rate
            var secondsToGetBlock = megabitsPerBlock / availableSpeed;
            staleRate = chanceOfNewBlock(secondsToGetBlock, time);
            // calculate annual cost
            var consumptionRatio = gigabytesPerMonth / availableEachMonth;
            var unitsEachYear = oneYear / timeUnits;
            var unitPrice = parseFloat(DOM.cappedPrice.value);
            bandwidthCost = unitsEachYear * unitPrice * consumptionRatio;
        }
        finalTotal += bandwidthCost;
        // Disk cost
        var diskPrice = parseFloat(DOM.diskPrice.value);
        var diskSize = parseFloat(DOM.diskSize.value) * 1000;
        var diskRatio = gigabytesPerYear / diskSize;
        var diskCost = diskPrice * diskRatio
        finalTotal += diskCost;
        // Processing cost
        var processingRate = parseFloat(DOM.processingRate.value);
        if (processingRate < txsPerSecond) {
            DOM.processingRate.classList.add("impossible");
            DOM.processingErrorMsg.classList.remove("hidden");
        }
        else {
            DOM.processingRate.classList.remove("impossible");
            DOM.processingErrorMsg.classList.add("hidden");
        }
        var processingPrice = parseFloat(DOM.processingPrice.value);
        var processingRatio = txsPerSecond / processingRate;
        var yearsPerLife = 5;
        var processingCost = processingPrice * processingRatio / yearsPerLife;
        finalTotal += processingCost;
        // Labor cost
        var laborPrice = parseFloat(DOM.laborPrice.value);
        var laborHours = parseFloat(DOM.laborHours.value);
        var laborCost = laborPrice * laborHours;
        finalTotal += laborCost;
        // show results
        DOM.hops.textContent = hops.toLocaleString();
        DOM.bandwidthTotal.textContent = megabitsPerSecondTotal.toLocaleString();
        DOM.bandwidthDown.textContent = megabitsPerSecondDown.toLocaleString();
        DOM.bandwidthUp.textContent = megabitsPerSecondUp.toLocaleString();
        DOM.dataCap.textContent = gigabytesPerMonth.toLocaleString();
        DOM.suppliedDiskCapacity.textContent = gigabytesPerYear.toLocaleString();
        DOM.processing.textContent = txsPerSecond.toLocaleString();
        DOM.staleRate.textContent = (staleRate * 100).toFixed(1);
        DOM.staleRate.title = (staleRate * 100).toFixed(5) + "%";
        DOM.bandwidthCost.textContent = bandwidthCost.toLocaleString();
        DOM.diskCost.textContent = diskCost.toLocaleString();
        DOM.processingCost.textContent = processingCost.toLocaleString();
        DOM.laborCost.textContent = laborCost.toLocaleString();
        DOM.finalTotal.textContent = finalTotal.toLocaleString();
        // Show bars
        var largestCost = Math.max(bandwidthCost, processingCost, diskCost, laborCost);
        var bandwidthBarSize = Math.round(bandwidthCost / largestCost * 100) + "%";
        var bandwidthPercent = Math.round(bandwidthCost / finalTotal * 100) + "%";
        DOM.bandwidthCostPercent.textContent = bandwidthPercent;
        DOM.bandwidthCostBar.style.width = bandwidthBarSize;
        var processingBarSize = Math.round(processingCost / largestCost * 100) + "%";
        var processingPercent = Math.round(processingCost / finalTotal * 100) + "%";
        DOM.processingCostPercent.textContent = processingPercent;
        DOM.processingCostBar.style.width = processingBarSize;
        var diskBarSize = Math.round(diskCost / largestCost * 100) + "%";
        var diskPercent = Math.round(diskCost / finalTotal * 100) + "%";
        DOM.diskCostPercent.textContent = diskPercent;
        DOM.diskCostBar.style.width = diskBarSize;
        var laborBarSize = Math.round(laborCost / largestCost * 100) + "%";
        var laborPercent = Math.round(laborCost / finalTotal * 100) + "%";
        DOM.laborCostPercent.textContent = laborPercent;
        DOM.laborCostBar.style.width = laborBarSize;
    }

    function chanceOfNewBlock(timeSinceLastBlock, avgBlockTime) {
        // See
        // https://en.bitcoin.it/wiki/Confirmation#Confirmation_Times
        // http://bitcoin.stackexchange.com/a/43592
        return 1 - Math.exp(-1*(timeSinceLastBlock / avgBlockTime));
    }

    function numberOfHops(totalNodes, connectionsPerNode) {
        // Assuming that there are no cycles (not a good assumption).
        // Need to account for network topology.
        // The current algorithm used here is too optimistic.
        // Most likely there would be more hops than this to fully propagate.
        return Math.ceil(Math.log(totalNodes) / Math.log(connectionsPerNode));
    }

    init();

})();
