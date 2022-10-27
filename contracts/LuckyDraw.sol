// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "./ThunderDomeNFT.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LuckyDraw is IERC721Receiver {
    address public manager;
    address[] public players;
    address public winner;
    ThunderDomeNFT public NFTContract;
    uint256 public prizeTokenId;

    event NewChallenger(address user);
    event WinnerPicked(address user);

    constructor(address _NFTContract, uint256 _prizeTokenId) {
        manager = msg.sender;
        NFTContract = ThunderDomeNFT(_NFTContract);
        prizeTokenId = _prizeTokenId;
    }

    function enter() public {
        require(winner == address(0), "Winner has already been picked.");

        uint256 senderBalance = NFTContract.balanceOf(msg.sender);
        require(
            senderBalance > 0,
            "You need to own an NFT to enter the lucky draw"
        );
        players.push(msg.sender);

        emit NewChallenger(msg.sender);
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, players)
                )
            );
    }

    function pickWinner() public {
        require(msg.sender == manager, "Only manager can pick winner");

        uint256 index = random() % players.length;

        winner = players[index];

        players = new address[](0);

        NFTContract.transferFrom(address(this), winner, prizeTokenId);

        emit WinnerPicked(winner);
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return players.length;
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
