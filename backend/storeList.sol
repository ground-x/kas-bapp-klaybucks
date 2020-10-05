pragma solidity ^0.5.6;
pragma experimental ABIEncoderV2;

contract StoreList {
    enum Status {activated, deactivated}
    struct Store {
        string name;
        string x;
        string y;
        address storeOwner;
        address storeContract;
        Status status;
    }

    address owner;
    Store[] stores;

    constructor() public {
        owner = msg.sender;
    }

    function addStore(string memory name, string memory x, string memory y,
        address storeOwner, address storeContract) public {
        require(msg.sender == owner);
        // Input validation will be placed here
        stores.push(Store(name, x, y, storeOwner, storeContract, Status.activated));
    }

    function getStores() public view returns (Store[] memory) {
        return stores;
    }
}