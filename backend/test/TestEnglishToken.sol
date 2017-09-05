pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/FixedSupplyToken.sol";

contract TestEnglishToken {

  function testCurrentEnglishTokenPrice() {

    uint startTime = now;
    uint endTime = now + 100000;

    //10000,"0xfc9c4bd011d14ebc2fca7f9454f7a50a3c7e4120","EAT", "English Auction Token", 17, 367, 367, 1497274438, 1499866438

    EnglishAuctionToken et = new EnglishAuctionToken(10000,
                                                     "0xfc9c4bd011d14ebc2fca7f9454f7a50a3c7e4120",
                                                     "EAT",
                                                     "English Auction Token",
                                                     17,
                                                     367,
                                                     367,
                                                     startTime,
                                                     endTime);


    //MetaCoin meta = MetaCoin(DeployedAddresses.MetaCoin());

    uint expected = 10000;
    Assert.equal(et.getBuyPrice(), expected, "Current price should be: 10000");
  }
}
