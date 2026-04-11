// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyRegistry.sol";
import "./PropertyNFT.sol";

contract Marketplace {
    PropertyRegistry public registry;
    PropertyNFT      public nft;

    uint256 public platformFeePercent = 2;
    address public feeRecipient;

    struct Escrow {
        uint256 propertyId;
        address buyer;
        uint256 amount;
        bool    released;
    }

    mapping(uint256 => Escrow) public escrows;

    event SaleInitiated(uint256 indexed propertyId, address indexed buyer, uint256 amount);
    event SaleCompleted(uint256 indexed propertyId, address indexed buyer, uint256 price);
    event SaleCancelled(uint256 indexed propertyId, address indexed buyer);

    constructor(address _registry, address _nft) {
        registry     = PropertyRegistry(_registry);
        nft          = PropertyNFT(_nft);
        feeRecipient = msg.sender;
    }

    function initiatePurchase(uint256 _propertyId) external payable {
        PropertyRegistry.Property memory prop = registry.getProperty(_propertyId);

        require(prop.isForSale,            "Not for sale");
        require(prop.owner != msg.sender,  "Cannot buy your own property");
        require(msg.value >= prop.price,   "Insufficient MATIC sent");
        require(!escrows[_propertyId].released, "Sale already in progress");

        escrows[_propertyId] = Escrow({
            propertyId: _propertyId,
            buyer:      msg.sender,
            amount:     msg.value,
            released:   false
        });

        emit SaleInitiated(_propertyId, msg.sender, msg.value);
    }

    function completeSale(
        uint256 _propertyId,
        string memory _tokenURI
    ) external {
        Escrow storage escrow = escrows[_propertyId];
        PropertyRegistry.Property memory prop = registry.getProperty(_propertyId);

        require(escrow.buyer != address(0), "No escrow found");
        require(!escrow.released,           "Already completed");
        require(
            msg.sender == prop.owner || msg.sender == escrow.buyer,
            "Not authorized"
        );

        escrow.released = true;

        uint256 fee    = (escrow.amount * platformFeePercent) / 100;
        uint256 payout = escrow.amount - fee;

        payable(prop.owner).transfer(payout);
        payable(feeRecipient).transfer(fee);

        nft.mintPropertyNFT(escrow.buyer, _propertyId, _tokenURI);
        registry.transferOwnership(_propertyId, escrow.buyer);

        emit SaleCompleted(_propertyId, escrow.buyer, escrow.amount);
    }

    function cancelSale(uint256 _propertyId) external {
        Escrow storage escrow = escrows[_propertyId];
        PropertyRegistry.Property memory prop = registry.getProperty(_propertyId);

        require(
            msg.sender == prop.owner || msg.sender == escrow.buyer,
            "Not authorized"
        );
        require(!escrow.released, "Already completed");

        uint256 refund  = escrow.amount;
        escrow.amount   = 0;
        escrow.released = true;

        payable(escrow.buyer).transfer(refund);
        emit SaleCancelled(_propertyId, escrow.buyer);
    }

    function getEscrow(uint256 _propertyId) external view returns (Escrow memory) {
        return escrows[_propertyId];
    }
}