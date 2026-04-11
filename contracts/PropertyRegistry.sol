// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PropertyRegistry {
    struct Property {
        uint256 id;
        string location;
        uint256 areaSqFt;
        uint256 price;
        address owner;
        bool isForSale;
        string ipfsHash;
        uint256 listedAt;
    }

    uint256 public propertyCount;
    mapping(uint256 => Property) public properties;
    mapping(address => uint256[]) public ownerProperties;

    event PropertyListed(uint256 indexed id, address indexed owner, uint256 price, string location);
    event PriceUpdated(uint256 indexed id, uint256 oldPrice, uint256 newPrice);
    event PropertyStatusChanged(uint256 indexed id, bool isForSale);

    modifier onlyOwner(uint256 _id) {
        require(properties[_id].owner == msg.sender, "Not the owner");
        _;
    }

    function listProperty(
        string memory _location,
        uint256 _areaSqFt,
        uint256 _price,
        string memory _ipfsHash
    ) external returns (uint256) {
        require(_price > 0, "Price must be > 0");
        require(_areaSqFt > 0, "Area must be > 0");

        propertyCount++;
        properties[propertyCount] = Property({
            id:        propertyCount,
            location:  _location,
            areaSqFt:  _areaSqFt,
            price:     _price,
            owner:     msg.sender,
            isForSale: true,
            ipfsHash:  _ipfsHash,
            listedAt:  block.timestamp
        });
        ownerProperties[msg.sender].push(propertyCount);

        emit PropertyListed(propertyCount, msg.sender, _price, _location);
        return propertyCount;
    }

    function updatePrice(uint256 _id, uint256 _newPrice) external onlyOwner(_id) {
        uint256 old = properties[_id].price;
        properties[_id].price = _newPrice;
        emit PriceUpdated(_id, old, _newPrice);
    }

    function toggleSaleStatus(uint256 _id) external onlyOwner(_id) {
        properties[_id].isForSale = !properties[_id].isForSale;
        emit PropertyStatusChanged(_id, properties[_id].isForSale);
    }

    function transferOwnership(uint256 _id, address _newOwner) external {
        require(
            msg.sender == properties[_id].owner,
            "Not authorized"
        );
        properties[_id].owner = _newOwner;
        properties[_id].isForSale = false;
        ownerProperties[_newOwner].push(_id);
    }

    function getProperty(uint256 _id) external view returns (Property memory) {
        return properties[_id];
    }

    function getAllProperties() external view returns (Property[] memory) {
        Property[] memory all = new Property[](propertyCount);
        for (uint256 i = 1; i <= propertyCount; i++) {
            all[i - 1] = properties[i];
        }
        return all;
    }

    function getOwnerProperties(address _owner) external view returns (uint256[] memory) {
        return ownerProperties[_owner];
    }
}