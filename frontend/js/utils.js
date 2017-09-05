'use strict';

const ETH_NETWORKS = Object.freeze({
    MAIN: 1,
    TEST_ROPSTEN: 3,
    KOVAN: 42,
    RINKEBY: 4
});

var notify = function(title, message, type, delay, onclosed) {
	delay = delay | 10000
	return $.notify({
        title: title,
        message: message,
    }, {
        delay: delay,
        type: type,
        onClosed: onclosed
    })
}

var get = function(endpoint, callback){
	$.get(endpoint, callback).fail(error => {
		notify("<strong>Error</strong>:", "AJAX Request failed with status code " + error.status, "danger");
	})
}


var isFunction = function(func){
    if(typeof func === 'function'){
        return true
    } else {
        return false
    }
}


var getUrlParameter = function getUrlParameter(sParam) {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

var initEtherUnitPopover = function(popoverId, targetId){
    $('[data-toggle="popover"]').popover({
        html: true
    });
    $(popoverId).on('show.bs.popover', () => {
        let unit = $(targetId).find(":selected").val()
        if(unit === 'ether'){
            unit = 'wei'
        }
        let msg = "1 ether = "
        let rate = web3.toBigNumber(web3.toWei(1, 'ether')).dividedBy(web3.toBigNumber(web3.toWei(1, unit)));
        rate = rate.toPrecision(1).toString()
        let index = rate.indexOf("e")
        if(index !== -1){
            rate = rate.substring(0, index) + " x 10<sup>" +  rate.substring(index + 2) + "</sup>"
        }
        msg += rate + " " + unit;
        $(popoverId).attr("data-content", msg)
    })
}

var getCurrentNetwork = function(cb){
    if(!isFunction(cb)){
        return null;
    }
    web3.version.getNetwork((err, netId) => {
        if(err){
            console.error(err);
            cb(err);
            return;
        }
        switch (netId) {
            case "1":
                cb(null, ETH_NETWORKS.MAIN);
                break
            case "2":
                cb(null, ETH_NETWORKS.TEST_ROPSTEN);
                break
            case "3":
                cb(null, ETH_NETWORKS.TEST_ROPSTEN);
                break
            default:
                cb(null, netId);
      }
    })
}