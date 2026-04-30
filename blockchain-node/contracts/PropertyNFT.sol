// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => uint256) public propertyToToken;
    mapping(uint256 => uint256) public tokenToProperty;

    event PropertyTokenized(uint256 indexed propertyId, uint256 indexed tokenId, address owner);

    constructor() ERC721("RealEstate NFT", "RENFT") Ownable(msg.sender) {}

    function mintPropertyNFT(
        address _to,
        uint256 _propertyId,
        string memory _tokenURI
    ) external onlyOwner returns (uint256) {
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        propertyToToken[_propertyId] = tokenId;
        tokenToProperty[tokenId] = _propertyId;

        emit PropertyTokenized(_propertyId, tokenId, _to);
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}