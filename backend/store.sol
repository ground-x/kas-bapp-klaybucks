pragma solidity ^0.5.6;
pragma experimental ABIEncoderV2;

contract Store {
    enum MenuStatus {activated, deactivated}
    enum OrderStatus {ordered, approved, denied}

    struct Menu {
        string name;
        uint32 price;
        uint256 reward;
        MenuStatus status;
    }

    struct Order {
        address payable customer;
        string content;
        uint32 reward;
        OrderStatus status;
    }

    event OrderReceipt(
        uint32 indexed _id,
        address indexed _from,
        string _paymentTxId,
        string _content,
        uint32 _price
    );

    address owner;
    string storeName;

    uint32 numMenus;
    mapping (uint32 => Menu) menus;

    uint32 numOrders;
    mapping (uint32 => Order) orders;

    constructor(string memory name, address addr) public {
        owner = addr;
        storeName = name;

        menus[numMenus] = Menu("all", 0, 0, MenuStatus.deactivated);
        numMenus = 1;
    }

    function getNumMenus() public view returns (uint32) {
        return numMenus;
    }

    function getMenu(uint32 menuId) public view returns (Menu memory) {
        return menus[menuId];
    }

    function addMenu(string memory name, uint32 price) public  {
        require(bytes(name).length > 0);

        menus[numMenus] = Menu(name, price, 0, MenuStatus.activated);
        numMenus = numMenus + 1;
    }

    function setRewardPolicy(uint32 menuId, uint256 rewardValue) public {
        menus[menuId].reward = rewardValue;
    }

    function deactivateMenu(uint32 menuId) public {
        menus[menuId].status = MenuStatus.deactivated;
    }

    function addOrder(string memory paymentTxId, string memory content, uint32 price) public {
        orders[numOrders] = Order(msg.sender, content, price, OrderStatus.ordered);
        emit OrderReceipt(numOrders, msg.sender, paymentTxId, content, price);
        numOrders = numOrders + 1;
    }

    function getOrder(uint32 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    function approveOrder(uint32 orderId, uint256 reward) public payable {
        // require(msg.sender == owner);
        orders[orderId].status = OrderStatus.approved;
        reward = orders[orderId].reward;
        if (reward > 0) {
            orders[orderId].customer.transfer(orders[orderId].reward);
        }
        // emit receipt
    }

    function denyOrder(uint32 orderId) public {
        orders[orderId].status = OrderStatus.denied;
        // emit receipt.
    }
}
