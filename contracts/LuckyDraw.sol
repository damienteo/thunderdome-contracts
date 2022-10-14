// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./ThunderDomeNFT.sol";

contract LuckyDraw {
    address public manager;
    address[] public players;
    address public winner;
    ThunderDomeNFT public NFTContract;

    event NewChallenger(address user);
    event WinnerPicked(address user);

    constructor(address _NFTContract) {
        manager = msg.sender;
        NFTContract = ThunderDomeNFT(_NFTContract);
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

        emit WinnerPicked(winner);
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
