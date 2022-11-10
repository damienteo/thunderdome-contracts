// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ExperiencePoints.sol";

contract Arena is Ownable {
    ExperiencePoints public experiencePoints;

    mapping(address => uint256) public gameScores;
    mapping(address => uint256) public userClaimed;

    constructor(ExperiencePoints _experiencePoints) {
        experiencePoints = _experiencePoints;
    }

    function logGameScore(address _gamer, uint256 _score) public onlyOwner {
        gameScores[_gamer] += _score;
    }

    function claimPrize(
        address _to,
        uint256 _amount,
        bytes memory signature
    ) public {
        require(verify(_to, _amount, signature) == true, "Invalid Signature");
        require(
            gameScores[_to] - userClaimed[_to] >= _amount,
            "Insufficient Claimable Points"
        ); // Prevent double-claim

        userClaimed[_to] += _amount; // Checks Effects Interactions => Reduce attack surface for malicious contracts
        experiencePoints.mint(_to, _amount);
    }

    function getMessageHash(address _to, uint256 _amount)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_to, _amount));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function verify(
        address _to,
        uint256 _amount,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = getMessageHash(_to, _amount);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == owner();
    }
}
