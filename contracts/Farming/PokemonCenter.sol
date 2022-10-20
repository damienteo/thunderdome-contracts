//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./PokePoint.sol";
import "../ThunderDomeNFT.sol";

import "hardhat/console.sol";

contract PokemonCenter {
    mapping(address => uint256[]) public depositedPokemon;
    mapping(address => bool) public isDeposited;
    mapping(address => uint256) public startBlockNumber;
    mapping(address => uint256) public pokePointBalance;

    PokePoint public pokePoint;
    ThunderDomeNFT public pokemon;

    event Deposited(address indexed from, uint256 tokenId);
    event Withdrawal(address indexed from, uint256 tokenId);
    event YieldWithdrawal(address indexed to, uint256 amount);

    constructor(PokePoint _pokePoint, ThunderDomeNFT _pokemon) {
        pokePoint = _pokePoint;
        pokemon = _pokemon;
    }

    function getNumberOfDeposits(address _owner) public view returns (uint256) {
        return depositedPokemon[_owner].length;
    }

    function deposit(uint256 _tokenId) public {
        require(
            pokemon.ownerOf(_tokenId) == msg.sender,
            "You do not own that Pokemon"
        );

        require(
            getNumberOfDeposits(msg.sender) < 6,
            "You can deposit only up to six pokemon"
        );

        if (isDeposited[msg.sender] == true) {
            uint256 yieldToTransfer = calculateTotalYield(msg.sender);
            pokePointBalance[msg.sender] += yieldToTransfer;
        }

        pokemon.transferFrom(msg.sender, address(this), _tokenId);
        depositedPokemon[msg.sender].push(_tokenId);
        startBlockNumber[msg.sender] = block.number;
        isDeposited[msg.sender] = true;

        emit Deposited(msg.sender, _tokenId);
    }

    function hasDepositedPokemon(address _depositor, uint256 _tokenId)
        private
        view
        returns (bool)
    {
        bool containsPokemon = false;

        for (uint256 i = 0; i < depositedPokemon[_depositor].length; i++) {
            if (depositedPokemon[_depositor][i] == _tokenId) {
                containsPokemon = true;

                break;
            }
        }

        return containsPokemon;
    }

    function indexOf(uint256[] storage array, uint256 _tokenId)
        private
        view
        returns (uint256)
    {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == _tokenId) {
                return i;
            }
        }

        revert("Pokemon not found");
    }

    function removePokemonFromArray(address _depositor, uint256 _tokenId)
        private
    {
        uint256 arrayIndex = indexOf(depositedPokemon[_depositor], _tokenId);

        for (
            uint256 i = arrayIndex;
            i < depositedPokemon[_depositor].length - 1;
            i++
        ) {
            depositedPokemon[_depositor][i] = depositedPokemon[_depositor][
                i + 1
            ];
        }

        depositedPokemon[_depositor].pop();
    }

    function withdraw(uint256 _tokenId) public {
        require(
            isDeposited[msg.sender] == true &&
                hasDepositedPokemon(msg.sender, _tokenId),
            "You don't have that pokemon to withdraw"
        );

        uint256 yieldToTransfer = calculateTotalYield(msg.sender);
        startBlockNumber[msg.sender] = block.number;

        removePokemonFromArray(msg.sender, _tokenId);
        pokemon.transferFrom(address(this), msg.sender, _tokenId);

        pokePointBalance[msg.sender] += yieldToTransfer;

        if (depositedPokemon[msg.sender].length == 0) {
            isDeposited[msg.sender] = false;
        }

        emit Withdrawal(msg.sender, _tokenId);
    }

    function withdrawYield() public {
        uint256 yieldToTransfer = calculateTotalYield(msg.sender);

        require(
            pokePointBalance[msg.sender] > 0 ||
                yieldToTransfer > 0 ||
                depositedPokemon[msg.sender].length > 0,
            "You have nothing to withdraw"
        );

        uint256 prevBalance = pokePointBalance[msg.sender];
        pokePointBalance[msg.sender] = 0;
        yieldToTransfer += prevBalance;

        startBlockNumber[msg.sender] = block.number;
        pokePoint.mint(msg.sender, yieldToTransfer);

        emit YieldWithdrawal(msg.sender, yieldToTransfer);
    }

    function calculateYieldBlocks(address _user)
        public
        view
        returns (uint256 totalTime)
    {
        uint256 end = block.number;
        return end - startBlockNumber[_user];
    }

    function calculateTotalYield(address _user)
        public
        view
        returns (uint256 rawYield)
    {
        return calculateYieldBlocks(_user) * 200 * getNumberOfDeposits(_user); // 200 tokens a block per pokemon deposited
    }
}
