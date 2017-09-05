pragma solidity ^0.4.8;
import "./FixedSupplyToken.sol";

contract AuctionToken is FixedSupplyToken {

    uint256 public buyPriceEnd;

    function AuctionToken(uint256 totalSupply,
    address _owner,
    string _symbol,
    string _name,
    uint256 _buyPriceStart,
    uint256 _buyPriceEnd,
    uint256 _sellPrice,
    uint256 _saleStart,
    uint256 _saleEnd) FixedSupplyToken (totalSupply, _owner, _symbol, _name, _buyPriceStart, _sellPrice, _saleStart, _saleEnd){
        /*if(_buyPriceStart > _buyPriceEnd) {
            throw;
        }*/
        buyPriceEnd = _buyPriceEnd;
    }

    function getBuyPrice() constant returns (uint) {
        uint currentPrice;
        uint passed;
        if(buyPrice < buyPriceEnd) {
            passed = now - saleStart;
            currentPrice = buyPrice + (((buyPriceEnd - buyPrice) * passed) / saleDuration);
        } else if (buyPrice > buyPriceEnd) {
            passed = now - saleStart;
            currentPrice = buyPrice - (((buyPrice - buyPriceEnd) * passed) / saleDuration);
        } else {
            currentPrice = buyPrice;
        }
        if(currentPrice <= 0){
            currentPrice = 1;
        }
        return currentPrice;
    }

    function getDetails() constant returns (address _owner, 
                                            string _name, 
                                            string _symbol, 
                                            uint256 totalSupply, 
                                            uint256 _creationDate,
                                            uint256 _buyPriceStart,
                                            uint256 _buyPriceEnd,
                                            uint256 _sellPrice,
                                            uint256 _saleStart,
                                            uint256 _saleEnd){
        return (owner, name, symbol, _totalSupply, creationDate, buyPrice, buyPriceEnd, sellPrice, saleStart, saleEnd);
    }
}