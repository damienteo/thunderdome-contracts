// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./ThunderDomeNFT.sol";

contract NFTSale is Ownable, ReentrancyGuard, IERC721Receiver {
    uint256 public nftPrice;
    ThunderDomeNFT public NFTContract;
    uint256 public adminPool;

    event Purchased(address buyer, uint256 tokenId, uint256 amountReceived);
    event Withdrawn(address withdrawer, uint256 amount);

    constructor(uint256 _nftPrice, address _NFTContract) payable {
        nftPrice = _nftPrice;
        NFTContract = ThunderDomeNFT(_NFTContract);
    }

    function purchaseNFT(uint256 tokenId) public payable nonReentrant {
        uint256 etherReceived = msg.value;

        require(etherReceived >= nftPrice, "Insufficient value sent");

        adminPool += etherReceived;

        NFTContract.transferFrom(address(this), msg.sender, tokenId);

        emit Purchased(msg.sender, tokenId, etherReceived);
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= adminPool, "Amount less than available");
        adminPool -= amount;

        (bool success, ) = (msg.sender).call{value: amount}("");
        require(success, "Failed to withdraw money from contract");

        emit Withdrawn(msg.sender, amount);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
