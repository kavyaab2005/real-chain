// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FractionalOwnership — Divide a property into shares (ERC-20 tokens)
contract FractionalOwnership is Ownable {

    struct FractionalProperty {
        uint256 propertyId;
        string  location;
        uint256 totalShares;
        uint256 pricePerShare;  // in wei
        address creator;
        bool    isActive;
        uint256 createdAt;
    }

    uint256 public propertyCount;

    // propertyId => FractionalProperty
    mapping(uint256 => FractionalProperty) public fractionalProperties;

    // propertyId => shareHolder => shares owned
    mapping(uint256 => mapping(address => uint256)) public sharesOwned;

    // propertyId => total shares sold
    mapping(uint256 => uint256) public sharesSold;

    event PropertyTokenized(
        uint256 indexed propertyId,
        string  location,
        uint256 totalShares,
        uint256 pricePerShare,
        address creator
    );

    event SharesPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 shares,
        uint256 totalPaid
    );

    event SharesTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 shares
    );

    constructor() Ownable(msg.sender) {}

    /// @notice Tokenize a property into fractional shares
    function tokenizeProperty(
        string memory _location,
        uint256 _totalShares,
        uint256 _pricePerShareEther
    ) external returns (uint256) {
        require(_totalShares > 0,         "Shares must be > 0");
        require(_pricePerShareEther > 0,  "Price must be > 0");

        propertyCount++;

        fractionalProperties[propertyCount] = FractionalProperty({
            propertyId:    propertyCount,
            location:      _location,
            totalShares:   _totalShares,
            pricePerShare: _pricePerShareEther * 1 ether,
            creator:       msg.sender,
            isActive:      true,
            createdAt:     block.timestamp
        });

        emit PropertyTokenized(
            propertyCount,
            _location,
            _totalShares,
            _pricePerShareEther * 1 ether,
            msg.sender
        );

        return propertyCount;
    }

    /// @notice Buy fractional shares of a property
    function buyShares(uint256 _propertyId, uint256 _shares) external payable {
        FractionalProperty storage prop = fractionalProperties[_propertyId];

        require(prop.isActive,                          "Property not active");
        require(_shares > 0,                            "Must buy at least 1 share");
        require(
            sharesSold[_propertyId] + _shares <= prop.totalShares,
            "Not enough shares available"
        );

        uint256 totalCost = prop.pricePerShare * _shares;
        require(msg.value >= totalCost, "Insufficient payment");

        // Transfer payment to property creator
        payable(prop.creator).transfer(totalCost);

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        sharesOwned[_propertyId][msg.sender] += _shares;
        sharesSold[_propertyId]              += _shares;

        emit SharesPurchased(_propertyId, msg.sender, _shares, totalCost);
    }

    /// @notice Transfer shares to another address
    function transferShares(
        uint256 _propertyId,
        address _to,
        uint256 _shares
    ) external {
        require(sharesOwned[_propertyId][msg.sender] >= _shares, "Not enough shares");
        require(_to != address(0), "Invalid address");

        sharesOwned[_propertyId][msg.sender] -= _shares;
        sharesOwned[_propertyId][_to]        += _shares;

        emit SharesTransferred(_propertyId, msg.sender, _to, _shares);
    }

    /// @notice Get shares available for a property
    function getAvailableShares(uint256 _propertyId) external view returns (uint256) {
        FractionalProperty storage prop = fractionalProperties[_propertyId];
        return prop.totalShares - sharesSold[_propertyId];
    }

    /// @notice Get shares owned by an address
    function getMyShares(uint256 _propertyId, address _holder)
        external view returns (uint256) {
        return sharesOwned[_propertyId][_holder];
    }

    /// @notice Get ownership percentage
    function getOwnershipPercent(uint256 _propertyId, address _holder)
        external view returns (uint256) {
        FractionalProperty storage prop = fractionalProperties[_propertyId];
        if (prop.totalShares == 0) return 0;
        return (sharesOwned[_propertyId][_holder] * 100) / prop.totalShares;
    }

    /// @notice Get all fractional properties
    function getAllFractionalProperties()
        external view returns (FractionalProperty[] memory) {
        FractionalProperty[] memory all = new FractionalProperty[](propertyCount);
        for (uint256 i = 1; i <= propertyCount; i++) {
            all[i - 1] = fractionalProperties[i];
        }
        return all;
    }
}