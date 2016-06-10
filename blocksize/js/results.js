new (function() {

    // Notes: In some cases a month is 31 days since we need to accout for
    // worst case scenario, in others a month is 365/12 days.

    var self = this;

    var oneDay = 60*60*24;
    var oneYear = oneDay*365;

    var DOM = {};
    // Parameters
    DOM.size = select(".parameters .block-size");
    DOM.blocks = select(".parameters .blocks");
    DOM.blockGrammar = select(".parameters .block-grammar");
    DOM.time = select(".parameters .time");
    // Results
    DOM.bandwidth = select(".results .bandwidth");
    DOM.dataCap = select(".results .data-cap");
    DOM.suppliedDiskCapacity = select(".results .disk-consumption");
    DOM.processing = select(".results .processing");
    // Costs
    DOM.bandwidthType = select(".costs .bandwidth .type");
    DOM.unlimited = select(".costs .unlimited");
    DOM.unlimitedPrice = select(".costs .unlimited .price");
    DOM.unlimitedTime = select(".costs .unlimited .time");
    DOM.unlimitedSpeed = select(".costs .unlimited .speed");
    DOM.capped = select(".costs .capped");
    DOM.cappedSize = select(".costs .capped .size");
    DOM.cappedTime = select(".costs .capped .time");
    DOM.cappedPrice = select(".costs .capped .price");
    DOM.bandwidthCost = select(".costs .bandwidth .total");
    DOM.diskSize = select(".costs .disk .size");
    DOM.diskPrice = select(".costs .disk .price");
    DOM.diskCost = select(".costs .disk .total");
    DOM.finalTotal = select(".costs .final .total");
    DOM.processingPrice = select(".processing .price");
    DOM.processingRate = select(".processing .rate");
    DOM.processingCost = select(".processing .total");
    DOM.laborHours = select(".labor .hours");
    DOM.laborPrice = select(".labor .price");
    DOM.laborCost = select(".labor .total");

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
            DOM.diskSize,
            DOM.diskPrice,
            DOM.processingPrice,
            DOM.processingRate,
            DOM.laborHours,
            DOM.laborPrice,
        ];
        var onChangeEls = [
            DOM.bandwidthType,
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
        var size = parseFloat(DOM.size.value);
        var blocks = parseFloat(DOM.blocks.value);
        var time = parseFloat(DOM.time.value);
        // grammar
        if (blocks == 1) {
            DOM.blockGrammar.textContent = "block";
        }
        else {
            DOM.blockGrammar.textContent = "blocks";
        }
        // calculations
        // results
        // bandwidth
        var megabitsPerBlock = size * 8;
        var blocksPerSecond = blocks / time;
        var megabitsPerSecond = megabitsPerBlock * blocksPerSecond;
        // data cap
        var secondsPerMonth = 60*60*24*31;
        var megabitsPerMonth = megabitsPerSecond * secondsPerMonth;
        var gigabytesPerMonth = megabitsPerMonth / 8 / 1000;
        // supplied disk capacity
        var secondsPerYear = 60*60*24*365;
        var megabitsPerYear = megabitsPerSecond * secondsPerYear;
        var gigabytesPerYear = megabitsPerYear / 8 / 1000;
        // processing
        var minTxSize = 226; // bytes
        var bytesPerBlock = size * 1000 * 1000;
        var txsPerBlock = bytesPerBlock / minTxSize;
        var txsPerSecond = txsPerBlock * blocksPerSecond;
        // costs
        var finalTotal = 0;
        var bandwidthType = DOM.bandwidthType.value;
        var bandwidthCost = 0;
        // bandwidth cost options
        DOM.unlimited.classList.add("hidden");
        DOM.capped.classList.add("hidden");
        if (bandwidthType == "unlimited") {
            // show unlimited options
            DOM.unlimited.classList.remove("hidden");
            // validate numbers
            var availableSpeed = parseFloat(DOM.unlimitedSpeed.value);
            if (availableSpeed < megabitsPerSecond) {
                // TODO this is an impossible situation
                // show an appropriate message
            }
            else {
                // TODO
                // hide appropriate message
            }
            // calculate annual cost
            var consumptionRatio = megabitsPerSecond / availableSpeed;
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
            var availableEachMonth = availableEachDay * 31;
            if (availableEachMonth < gigabytesPerMonth) {
                // TODO this is an impossible situation
                // show an appropriate message
            }
            else {
                // TODO
                // hide appropriate message
            }
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
        var processingPrice = parseFloat(DOM.processingPrice.value);
        var processingRate = parseFloat(DOM.processingRate.value);
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
        DOM.bandwidth.textContent = megabitsPerSecond.toLocaleString();
        DOM.dataCap.textContent = gigabytesPerMonth.toLocaleString();
        DOM.suppliedDiskCapacity.textContent = gigabytesPerYear.toLocaleString();
        DOM.processing.textContent = txsPerSecond.toLocaleString();
        DOM.bandwidthCost.textContent = bandwidthCost.toLocaleString();
        DOM.diskCost.textContent = diskCost.toLocaleString();
        DOM.processingCost.textContent = processingCost.toLocaleString();
        DOM.laborCost.textContent = laborCost.toLocaleString();
        DOM.finalTotal.textContent = finalTotal.toLocaleString();
    }

    init();

})();
