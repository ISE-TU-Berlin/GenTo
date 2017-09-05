/**
 * Created by florian on 13.06.17.
 */
let backendUrl = "http://" + window.location.hostname + ":3000/"

let auctionInterval, supplyInterval, auctionChart, purchaseNotify

let auctionDetails = {
    unit: 'finney',
    status: null,
    auctionType: null,
    data: null,
    remainingSupply: null,
    eth: {
        account: null,
        network: null,
        tokenCount: null
    },
    contract: {
        data: null,
        address: null
    },
    deployedInstance: null
}


var loadContract = function(){
    updateAccount()
    var accountInterval = setInterval(function() {
      updateAccount()
    }, 1000);
    getCurrentNetwork(updateNetwork)
}


var updateAccount = function(){
    var newAccount = web3.eth.accounts[0]
    let accountChanged = false
    if (newAccount !== auctionDetails.eth.account && newAccount !== undefined) {
        if(auctionDetails.eth.account !== null){
            notify("<strong>Account has changed:</strong>", "Switched to account " + newAccount, "success");
        }
        auctionDetails.eth.account = newAccount
        accountChanged = true
    }
    if(auctionDetails.eth.tokenCount == null || accountChanged){
        setMyTokenCount()
    }
}

var updateNetwork = function (err, network) {
    if(err) {
        console.error(err)
    } else {
        if(network !== auctionDetails.eth.network){
            auctionDetails.eth.network = network
            loadAuctionContract((err, contract) => {
                if(err){
                    auctionDetails.contract.data = null
                } else {
                    auctionDetails.contract.data = contract
                    auctionDetails.contract.address = getUrlParameter("address")
                    loadDetails()
                    $('#submitBtn').prop('disabled', false);
                    listenForTokenBuy()
                }
            })
        }
    }
}

var setMyTokenCount = function(){
    checkSupply(auctionDetails.eth.account, (err, res) => {
        let msg
        if(err){
            msg = "Pending..."
            auctionDetails.eth.tokenCount = null
        } else {
            let amount = res.toNumber()
            auctionDetails.eth.tokenCount = amount
            msg = "You own <strong>" + amount + "</strong> " + auctionDetails.data._symbol + " <strong>(=" + (amount * 100 / auctionDetails.data._totalSupply).toFixed(2) + "%)</strong> " 
        }
        $('#myTokenCount').html(msg)
    })
}

var checkSupply = function(address, callback){
    if(!(web3 && auctionDetails.contract.data && auctionDetails.eth.network && auctionDetails.contract.address && isFunction(callback))){
        callback(new Error("Contract not ready for usage"))
        return
    }
    var auctionToken = web3.eth.contract(auctionDetails.contract.data.abi);
    var instance = auctionToken.at(auctionDetails.contract.address);
    var buyer = auctionDetails.eth.account;
    instance.balanceOf(address, (error, result) => {
        if(error) {
            callback(error)
        }
        else {
            callback(null, result)
        }
    })  
}


var listenForTokenBuy = function(){
    if(!(web3 && auctionDetails.contract.data && auctionDetails.eth.network && auctionDetails.contract.address)){
        return;
    }
    var auctionToken = web3.eth.contract(auctionDetails.contract.data.abi);
    var instance = auctionToken.at(auctionDetails.contract.address);
    var buyer = auctionDetails.eth.account;
    instance.Transfer((error, result) => {
        if(error) {
            console.error(error)
        }
        else {
            if(auctionDetails.data) {
                let remainingSupply = result.args._remainingSupply.toNumber();
                updateSupplyBar(remainingSupply);
            }
            let amount = result.args._value.toNumber();
            if (amount > 0){
                if(purchaseNotify){
                    purchaseNotify.close();
                }
                purchaseNotify = notify("<strong>Success!</strong>", amount + " Token(s) purchased.","success")
                setMyTokenCount()
            }
        }
    })  
}


var loadAuctionContract = function(cb){
    get(backendUrl + "contracts/auction", data => {
        cb(null, data)
    })
}

function updateSupplyBar(supply) {
    let totalSupply = auctionDetails.data._totalSupply;
    let supplyBar = $('#supplyBar');
    let supplyPct = (supply / totalSupply) * 100;
    supplyBar.attr("aria-valuenow", supplyPct);
    supplyBar.attr("style", "width:" + Math.max(20, supplyPct) + "%");
    supplyBar.html(Math.floor(supplyPct) + "% left")
    $("#supplyCountdown").html(supply +" of " + totalSupply +" left for sale");
}

let setSupplyInterval = function(){
    let data = auctionDetails.data;

        checkSupply(data._owner, (err, supply) => {
            if(err){
                console.error(err)
            } else {
                supply = supply.toNumber();
                updateSupplyBar(supply);


                if (supply <= 0) {
                    clearInterval(auctionInterval)

                    let diff = moment().diff(moment.unix(data._creationDate));
                    let duration = moment.duration(diff);

                    let timeBar = $('#timeBar');
                    timeBar.attr("aria-valuenow", 0);
                    timeBar.attr("style", "width: 20%");
                    timeBar.html("0%")

                    $("#supplyCountdown").html("Sold out!")
                    $("#timeCountdown").html("Sold out after "+ duration.days() + "d " + duration.hours() + "h " + duration.minutes() + "m " + duration.seconds() + "s");
                    clearInterval(supplyInterval)
                }
            }
        })
}

let buyToken = function(){
    if(!(web3 && auctionDetails.contract.data && auctionDetails.eth.network && auctionDetails.contract.address)){
        return
    }
    var auctionToken = web3.eth.contract(auctionDetails.contract.data.abi);
    var instance = auctionToken.at(auctionDetails.contract.address);
    var buyer = auctionDetails.eth.account;
    var amount = web3.toWei($('#buyAmount').val(), $('#etherUnits').find(":selected").val())
    if(amount <= 0){
        notify("<strong>Invalid amount:</strong>", "Amount must be greater than zero", "danger");
        return;
    }
    web3.eth.estimateGas({
        data: auctionDetails.contract.data.unlinked_binary
    }, (err, gas) => {
        if(err){
            console.error(err)
            return
        }
        instance.buy(
            {
                from: buyer,
                data: auctionDetails.contract.data.unlinked_binary,
                value: amount,
                gas: gas
            }, (error, result) => {
                if(error) {
                    notify("<strong>Error:</strong>", "Error processing transaction.", "danger");
                    console.error(error)
                }
            })  
    })
}

let setAuctionTimer = function() {
    let data = auctionDetails.data;
    let status = auctionDetails.status;
    if(status === "pending"){
        $('#timeCountdown').html("Auction will start at " + moment.unix(data._saleStart).format('LLL'));
    } else if (status === "running"){
        var endTime = moment.unix(data._saleEnd)
        var duration = moment.duration(endTime.diff(moment()), 'milliseconds');
        var timeBar = $('#timeBar');
        var interval = 1000;

        $('#timeCountdown').html(duration.days() + " d " + duration.hours() + " h " + duration.minutes() + " m " + duration.seconds() + " s left")
        auctionInterval = setInterval(function(){
            if(endTime.diff(moment()) < 0){
                window.location.reload(true);
            }
            duration = moment.duration(duration - interval, 'milliseconds');
            $('#timeCountdown').html(duration.days() + " d " + duration.hours() + " h " + duration.minutes() + " m " + duration.seconds() + " s left")
            let currentPercentage = (endTime.diff(moment()) / endTime.diff(moment.unix(data._saleStart)))*100;
            timeBar.attr("aria-valuenow", currentPercentage);
            timeBar.attr("style", "width:"+ Math.max(20, currentPercentage) +"%");
            timeBar.html(Math.floor(currentPercentage) + "% left");
        }, interval);
    } else {
        //auction is over
        $('#timeCountdown').html("Auction ended at " + moment.unix(data._saleEnd).format('LLL'));
    }

}

let getChartData = function(){
    let data = auctionDetails.data;
    let cd = [];
    cd.push({
        x: moment.unix(data._saleStart).valueOf(),
        y: data._buyPriceStart
    });
    let duration = data._saleEnd - data._saleStart;
    if(auctionDetails.status === "running"){
        var passed = moment().unix() - data._saleStart;
        var currPrice = Math.floor(data._buyPriceStart + ((data._buyPriceEnd - data._buyPriceStart) * passed) / duration);
        cd.push({
            x: moment.unix(data._saleStart + passed).valueOf(),
            y: currPrice
        });
    }
    cd.push({
        x: moment.unix(data._saleEnd).valueOf(),
        y: data._buyPriceEnd
    });
    return cd;
}

let getPointColor = function(length){
    let defaultColor = 'rgb(255, 99, 132)';
    if(length === 3){
        return [
            defaultColor,
            'rgb(0, 99, 132)',
            defaultColor
        ]
    } else {
        return defaultColor
    }
}

let initAuctionChart = function(){
    let data = auctionDetails.data;
    let ctx = document.getElementById('auctionChart').getContext('2d');
    let chartData = getChartData(data)
    let pointBgColor = getPointColor(chartData.length);
    let pointBorderColor = getPointColor(chartData.length);
    auctionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: pointBgColor,
                pointBorderColor: pointBgColor,
                fill: false,
                data: chartData,
                xAxisID: "timeAxis"
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    id: 'timeAxis',
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'll'
                        }
                    }
                }]
            },   
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return moment(tooltipItem.xLabel).format('LLL') + ": " + tooltipItem.yLabel;
                    }
                }
            }
        }
    })
}

let getAuctionType = function(){
    let data = auctionDetails.data;
    if(data._buyPriceStart < data._buyPriceEnd){
        return "english";
    } else if (data._buyPriceStart > data._buyPriceEnd){
        return "dutch";
    } else {
        return "fixed";
    }
}

let getCurrentStatus = function(){
    let data = auctionDetails.data;
    let start = moment.unix(data._saleStart);
    let end = moment.unix(data._saleEnd);
    let now = moment();
    if(now.diff(start) < 0){
        return "pending";
    } else if (now.diff(end) < 0){
        return "running";
    } else {
        return "over";
    }
}

let initAuctionDetails = function(data){
    auctionDetails.data = data;
    auctionDetails.data._buyPriceStart = parseInt(web3.fromWei(auctionDetails.data._buyPriceStart, auctionDetails.unit), 10);
    auctionDetails.data._buyPriceEnd = parseInt(web3.fromWei(auctionDetails.data._buyPriceEnd, auctionDetails.unit), 10);
    auctionDetails.status = getCurrentStatus();
    auctionDetails.auctionType = getAuctionType();
}

let getPriceDevelopment = function(){
    let data = auctionDetails.data;
    let priceDev = "The token price ";
    if(auctionDetails.auctionType === "dutch"){
        priceDev += "will <strong>decrease</strong> from <strong>" + data._buyPriceStart + "</strong> to <strong>" + data._buyPriceEnd + "</strong>";
    } else if (auctionDetails.auctionType === "english"){
        priceDev += "will <strong>increase</strong> from <strong>" + data._buyPriceStart + "</strong> to <strong>" + data._buyPriceEnd + "</strong>";
    } else {
        priceDev += "is <strong>" + data._buyPriceStart + "</strong>";
    }
    priceDev += " " + auctionDetails.unit;
    return priceDev;
}

var parseContractDetails = function(rawData){
    return {
        _owner: rawData[0], 
        _name: rawData[1], 
        _symbol: rawData[2], 
        _totalSupply: rawData[3].toNumber(), 
        _creationDate: rawData[4].toNumber(), 
        _buyPriceStart: rawData[5].toNumber(), 
        _buyPriceEnd: rawData[6].toNumber(), 
        _sellPrice: rawData[7].toNumber(), 
        _saleStart: rawData[8].toNumber(), 
        _saleEnd: rawData[9].toNumber()
    }
}

let getContractDetails = function (address) {
    if(!(web3 && auctionDetails.contract.data && auctionDetails.eth.network && auctionDetails.contract.address)){
        return
    }
    var auctionToken = web3.eth.contract(auctionDetails.contract.data.abi);
    var instance = auctionToken.at(address);
    instance.getDetails((error, result) => {
        if(error){
            console.error(error)
        } else {
            console.log(result);
            let data = parseContractDetails(result)
            initAuctionDetails(data);

            initAuctionChart();

            // remove spinner
            $('.glyphicon-refresh').remove();

            $("<p>" + data._name + "</p>").insertAfter('#tokenName');
            $("<p>" + data._symbol + "</p>").insertAfter('#tickerSymbol');
            $("<p>" + data["_owner"] + "</p>").insertAfter('#owner');
            $("<p>" + moment.unix(data._creationDate).format('LLL') + "</p>").insertAfter('#creationDate');
            let priceDevelopmentString = getPriceDevelopment();
            $("<p>" + priceDevelopmentString + "</p>").insertAfter('#priceOverTime');

            // set period
            setAuctionTimer();
            // total supply
            setSupplyInterval();
        }
    })
};


let handleFatalError = function (msg) {
    window.location.href = "../?e=" + btoa(msg);
}

let loadDetails = function () {
    let contractAddress = getUrlParameter("address");
    if (contractAddress) {
        if (web3.isAddress(contractAddress)) {
            getContractDetails(contractAddress);
        } else {
            handleFatalError("Not a valid ethereum address: " + contractAddress);
        }
    } else {
        handleFatalError("Missing address parameter");
    }
};


window.onload = function () {
    initEtherUnitPopover('#etherUnitInfo', '#etherUnits')
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider)
    } else {
        notify('No web3?', 'You should consider trying MetaMask and Chrome!', 'warning');
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
    }
    loadContract()
};