pragma solidity ^0.4.8;

import "./ERC20Interface.sol";

contract FixedSupplyToken is ERC20Interface {
    string public symbol = "";
    string public name = "";

    uint256 public creationDate;

    uint8 public constant decimals = 18;
    uint256 _totalSupply = 0;

    uint256 saleStart = 0;
    uint256 saleEnd = 0;
    uint256 saleDuration = 0;

    // Owner of this contract
    address public owner;

    // Balances for each account
    mapping(address => uint256) balances;

    // Owner of account approves the transfer of an amount to another account
    mapping(address => mapping (address => uint256)) allowed;

    // Functions with this modifier can only be executed by the owner
    modifier onlyOwner() {
        if (msg.sender != owner) {
            throw;
        }
        _;
    }

    modifier notInPast(uint timestamp){
        require(now >= timestamp);
        _;
    }

    modifier saleRunning() {
        if(now < saleStart || now > saleEnd) {
            throw;
        }
        _;
    }

    // Constructor
    function FixedSupplyToken(uint256 totalSupply, address _owner, string _symbol, string _name, uint256 _buyPrice, uint256 _sellPrice, uint _saleStart, uint _saleEnd) {
        if(_saleEnd < _saleStart){
            throw;
        }
        owner = _owner;
        _totalSupply = totalSupply;
        balances[owner] = _totalSupply;
        symbol = _symbol;
        name = _name;
        buyPrice = _buyPrice;
        sellPrice = _sellPrice;
        saleEnd = _saleEnd;
        saleStart = _saleStart;
        saleDuration = saleEnd - saleStart;
        creationDate = now;
    }


    function totalSupply() constant returns (uint256 totalSupply) {
        totalSupply = _totalSupply;
    }

    // What is the balance of a particular account?
    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    // Transfer the balance from owner's account to another account
    function transfer(address _to, uint256 _amount) returns (bool success) {
        if (balances[msg.sender] >= _amount
        && _amount > 0
        && balances[_to] + _amount > balances[_to]) {
            balances[msg.sender] -= _amount;
            balances[_to] += _amount;
            Transfer(msg.sender, _to, _amount, balances[owner]);
            return true;
        } else {
            return false;
        }
    }

    // Send _value amount of tokens from address _from to address _to
    // The transferFrom method is used for a withdraw workflow, allowing contracts to send
    // tokens on your behalf, for example to "deposit" to a contract address and/or to charge
    // fees in sub-currencies; the command should fail unless the _from account has
    // deliberately authorized the sender of the message via some mechanism; we propose
    // these standardized APIs for approval:
    function transferFrom(
    address _from,
    address _to,
    uint256 _amount
    ) returns (bool success) {
        if (balances[_from] >= _amount
        && allowed[_from][msg.sender] >= _amount
        && _amount > 0
        && balances[_to] + _amount > balances[_to]) {
            balances[_from] -= _amount;
            allowed[_from][msg.sender] -= _amount;
            balances[_to] += _amount;
            Transfer(_from, _to, _amount, balances[owner]);
            return true;
        } else {
            return false;
        }
    }

    // Allow _spender to withdraw from your account, multiple times, up to the _value amount.
    // If this function is called again it overwrites the current allowance with _value.
    function approve(address _spender, uint256 _amount) returns (bool success) {
        allowed[msg.sender][_spender] = _amount;
        Approval(msg.sender, _spender, _amount);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    uint256 public sellPrice;
    uint256 public buyPrice;

    function getBuyPrice() constant returns (uint);

    function buy() payable returns (uint amount){
        amount = msg.value / getBuyPrice();                     // calculates the amount
        if (balances[owner] < amount || amount <= 0) throw;     // checks if it has enough to sell
        balances[msg.sender] += amount;                   // adds the amount to buyer's balance
        balances[owner] -= amount;                         // subtracts amount from seller's balance
        Transfer(owner, msg.sender, amount, balances[owner]);                // execute an event reflecting the change
        return amount;                                     // ends function and returns
    }

    function sell(uint amount) returns (uint256 revenue){
        if (balances[msg.sender] < amount ) throw;        // checks if the sender has enough to sell
        balances[owner] += amount;                         // adds the amount to owner's balance
        balances[msg.sender] -= amount;                   // subtracts the amount from seller's balance
        revenue = amount * sellPrice;
        if (!msg.sender.send(revenue)) {                   // sends ether to the seller: it's important
            throw;                                         // to do owner last to prevent recursion attacks
        } else {
            Transfer(msg.sender, owner, amount, balances[owner]);             // executes an event reflecting on the change
            return revenue;                                 // ends function and returns
        }
    }
}