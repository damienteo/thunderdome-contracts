// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ThunderDomeNFT.sol";

contract MarketPlace is Ownable, ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 listingPrice;
        address buyer;
        uint256 buyerDeposit;
    }

    uint256 public adminPool;
    uint256 public publicPool;
    uint256 public commission;
    ThunderDomeNFT public NFTContract;
    mapping(uint256 => Listing) public listings;

    event ListingMade(address seller, uint256 tokenId, uint256 listingPrice);
    event ListingWithdrawn(address seller, uint256 tokenId);
    event Approved(uint256 tokenId, bool shopAproval);
    event BuyerDeposited(
        uint256 tokenId,
        address buyer,
        uint256 amount,
        uint256 depositAmount
    );
    event BuyerWithdrawn(uint256 tokenId, uint256 amount);

    constructor(address _NFTContract, uint256 _commission) payable {
        NFTContract = ThunderDomeNFT(_NFTContract);
        commission = _commission;
    }

    function makeListing(uint256 tokenId, uint256 price) public {
        require(price > commission, "The listing price is too low");

        NFTContract.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId].seller = msg.sender;
        listings[tokenId].listingPrice = price;

        emit ListingMade(msg.sender, tokenId, price);
    }

    function withdrawListing(uint256 tokenId) public nonReentrant {
        require(
            listings[tokenId].seller == msg.sender,
            "Only seller can withdraw the listing"
        );

        listings[tokenId].seller = address(0);

        NFTContract.transferFrom(address(this), msg.sender, tokenId);

        uint256 refundAmount = listings[tokenId].buyerDeposit;

        if (refundAmount > 0) {
            listings[tokenId].buyer = address(0);
            listings[tokenId].buyerDeposit = 0;

            (bool success, ) = (msg.sender).call{value: refundAmount}("");
            require(success, "Failed to refund bidder");
        }

        emit ListingWithdrawn(msg.sender, tokenId);
    }

    function bid(uint256 tokenId) public payable {
        require(
            listings[tokenId].seller != address(0),
            "This NFT is not for sale"
        );
        require(
            listings[tokenId].buyer != address(0),
            "An offer has already been made for this listing"
        );

        uint256 targetPrice = listings[tokenId].listingPrice;
        require(msg.value >= targetPrice, "Insufficient value");

        listings[tokenId].buyer = msg.sender;
        listings[tokenId].listingPrice = msg.value;

        emit BuyerDeposited(tokenId, msg.sender, tokenId, msg.value);
    }

    function withdrawBid(uint256 tokenId) public nonReentrant {
        require(listings[tokenId].buyer == msg.sender, "You are not the owner");

        uint256 refundAmount = listings[tokenId].buyerDeposit;

        listings[tokenId].buyer = address(0);
        listings[tokenId].buyerDeposit = 0;

        (bool success, ) = (msg.sender).call{value: refundAmount}("");
        require(success, "Failed to withdraw money from contract");

        emit BuyerWithdrawn(tokenId, refundAmount);
    }

    function acceptOffer(uint256 tokenId) public nonReentrant {
        require(listings[tokenId].buyer == msg.sender, "You are not the owner");
        require(
            listings[tokenId].buyer != address(0),
            "An offer has not been made"
        );

        address seller = listings[tokenId].seller;
        uint256 transferAmount = listings[tokenId].buyerDeposit;
        address buyer = listings[tokenId].buyer;

        listings[tokenId].seller = address(0);
        listings[tokenId].listingPrice = 0;
        listings[tokenId].buyer = address(0);
        listings[tokenId].buyerDeposit = 0;

        NFTContract.transferFrom(seller, buyer, tokenId);

        (bool paymentSuccess, ) = (seller).call{value: transferAmount}("");
        require(paymentSuccess, "Failed to send money to seller");

        (bool commissionSuccess, ) = (address(this)).call{value: commission}(
            ""
        );
        require(
            commissionSuccess,
            "Failed to send commission to contract owner"
        );
        adminPool += commission;
    }
}
