/*
    ----------------------------------------------------------------------------------------------
    ----------------------------------------------------------------------------------------------
        GenTo Application code
    ----------------------------------------------------------------------------------------------
    ----------------------------------------------------------------------------------------------
 */

var gento = {
    eth: {
        account: null,
        network: null,
    },
    contractFactory: {
        data: null,
        address: null
    },
    deployedInstance: null
}

const backend_host = "http://"+ window.location.hostname +":3000/"

var startApp = function(){
    var accountInterval = setInterval(function() {
      updateAccount()
    }, 1000);
    updateAccount()
    getCurrentNetwork(updateNetwork)
}

var updateAccount = function(){
    var newAccount = web3.eth.accounts[0]
    if (newAccount !== gento.eth.account) {
        var accountSwitched = (gento.eth.account !== null && gento.eth.account !== undefined);
        gento.eth.account = newAccount;
        if(accountSwitched){
            notify("<strong>Account has changed:</strong>", "Switched to account " + newAccount, "success")
            listIcos();
        }

        //$('#currentAccount').val(newAccount)
        $('#contractCurrentAddress').text(newAccount)

    }
}

var updateNetwork = function (err, network) {
    if(err) {
        console.error(err)
    } else {
        if(network !== gento.eth.network){
            gento.eth.network = network
            getContractData(network, (err, contract) => {
                if(err){
                    gento.contractFactory.data = null
                } else {
                    gento.contractFactory.data = contract
                }
                updateContractAddress()
            })
        }
    }
}

var updateContractAddress = function(){
    var addressText
    if(!gento.eth.network || !gento.contractFactory.data || Object.keys(gento.contractFactory.data.networks).length == 0){
        addressText = "Error loading contract address"
    } else {
        if(gento.contractFactory.data.networks[gento.eth.network.toString()]){
            gento.contractFactory.address = gento.contractFactory.data.networks[gento.eth.network].address
            addressText = gento.contractFactory.address
            console.log(gento.contractFactory.address);
            listIcos();
        } else {
            gento.contractFactory.address = null
            addressText = "Contract not deployed on current network with id " + gento.eth.network
        }
    }
    $('#contractFactory').val(addressText)
}

var getContractData = function(network, cb){
    if(!isFunction(cb)){
        return
    }
    get(backend_host + "contracts/factory", data => {
        cb(null, data)
    })
}

function submitTokenContract() {

    if(!(web3 && gento.contractFactory.data && gento.eth.network && gento.contractFactory.address)){
        return
    }

    $('#submitBtn').prop('disabled', true);

    var tokenName = $("#tokenName").val();
    var tickerSymbol = $("#tickerSymbol").val();
    var token = $("#token").val();
    var tokenRole = $("#tokenRole").val();
    var totalSupply = $("#tokenAmount").val();
    var typeOfAuction = $('input[name=auction]:checked', '#tokenForm').val();
    var selectedCurrency = $("#currencypicker").find(":selected").val();
    var minimumPrice = $("#minimumPrice").val();
    var maximumPrice = $("#maximumPrice").val();
    var sellPrice = maximumPrice;

    if(maximumPrice < minimumPrice){
        $.notify("<strong>Min > Max</strong>", "You maximum token price needs to be higher then the minimum token price", "warning", 0);
        $('#submitBtn').prop('disabled', false);
        return
    }
    if(typeOfAuction === "dutch"){
        let tmp = minimumPrice
        minimumPrice = maximumPrice
        maximumPrice = tmp
    }
    let datePicker = $('#reportrange').data('daterangepicker')
    let saleStart = Math.floor(datePicker.startDate.valueOf() / 1000);
    let saleEnd = Math.floor(datePicker.endDate.valueOf() / 1000);
    const now = Math.floor(new Date()/1000);

    //checks weather the saleStart is today, if add the current time to it
    if((now >= saleStart) && (now <= saleStart+ 86400)){
        let tmpSaleStart = saleStart;
        saleStart += (now - tmpSaleStart)
    }

    var owner = gento.eth.account;

    var GenToFactory = web3.eth.contract(gento.contractFactory.data.abi);
    var instance = GenToFactory.at(gento.contractFactory.address);
    web3.eth.estimateGas({
        data: gento.contractFactory.data.unlinked_binary
    }, (err, gas) => {
        instance.createContract(
            web3.toBigNumber(totalSupply).toString(10), 
            tickerSymbol, 
            tokenName, 
            web3.toWei(minimumPrice, selectedCurrency),
            web3.toWei(maximumPrice, selectedCurrency),
            web3.toWei(sellPrice, selectedCurrency),
            web3.toBigNumber(saleStart).toString(10),
            web3.toBigNumber(saleEnd).toString(10),
            {
                from: owner,
                data: gento.contractFactory.data.unlinked_binary,
                gas: gas
            }, (err, result) => {
                if(err) {
                    console.error(err)
                }
                else {
                    handleContractCreatedEvent(instance)
                    console.log(result)
                }
            })  
    })
}

function handleContractCreatedEvent(instance) {
    instance.ContractCreated({
        owner: gento.eth.account
    }, (err, res) => {
        if(!err){
            console.log(res)
            var address = res.args.contractAddress
            if(address !== gento.deployedInstance){
                gento.deployedInstance = address
                $.notify({
                    title: "<strong>ICO created</strong>",
                    message: "Click me to review your ICO",
                    url: "/details/?address=" + address,
                    target: "_self"
                }, {
                    delay: 0,
                    type: "success"
                })
            }
        } else {
            console.error(err)
        }
    });
}

let addIcoEntry = function(data, address){

    if(!(web3 && gento.eth.network && gento.contractFactory.address)){
        return
    }

    var AuctionToken = web3.eth.contract(data.abi);
    var instance = AuctionToken.at(address);
    instance.getDetails((err, result) => {
        if(err){
            console.error(err);
            return;
        } else {
            let creationDate = result[4].toNumber();
            let name = result[1];

            var date = moment.unix(creationDate).format('LL');
            $("#icoListContainer").append(
                '<a href="/details/?address='+address+'" class="list-group-item list-group-item-action" >'+
                    '<div class="contract-list-row">'+
                        '<div class="contract-list-address" >'+address+'</div>'+
                        '<div class="contract-list-information">'+
                        '<div class="contract-list-name-container">'+
                        '<div class=" glyphicon contract-list-coin-container"></div><label class="contract-list-label" id="coinName">'+name+'</label>'+
                        '</div>'+
                        '<div class="contract-list-date-container">'+
                        '<div class="glyphicon glyphicon-calendar contract-list-date"></div><label class="contract-list-label" id="contractDate">'+date+'</label>'+
                        '</div>'+
                        '</div>'+
                    '</div>'+
                '</a>'
            );
        }
    })

}

let getContractDetails = function(addressList){
    get(backend_host + 'contracts/auction', data => {
        for( var x = 0; x < addressList.length; x++)
        {
            addIcoEntry(data, addressList[x]);
        }
    })
};


function listIcos(){
    if(!(web3 && gento.contractFactory.data && gento.eth.network && gento.contractFactory.address)){
        return
    }

    var owner = gento.eth.account;
    var GenToFactory = web3.eth.contract(gento.contractFactory.data.abi);
    var instance = GenToFactory.at(gento.contractFactory.address);

    instance.getICOsFromOwner(owner, (error, result) =>{

        if(!error) {
            $("#icoListContainer").empty();
            getContractDetails(result);
        }
        else {
            console.error(error);
        }
    });
}

var checkForError = function(){
    var error = getUrlParameter("e");
    if(error){
        notify("<strong>Error:</strong>", atob(error), 'danger')
    }
}

window.onload = function () {
    checkForError();
    initEtherUnitPopover('#currencyInfo', '#currencypicker')
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      window.web3 = new Web3(web3.currentProvider)
    } else {
        notify("<strong>Error:</strong>", "No web3? You should consider trying MetaMask and Google Chrome!", 'danger', 0)
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
    }

    // Now you can start your app & access web3 freely:
    startApp()
};
