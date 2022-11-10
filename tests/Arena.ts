import { expect } from "chai";
import { ethers } from "hardhat";

import { Arena, ExperiencePoints } from "../typechain-types/contracts/Arena";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const amount = 123;
const MINTER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("MINTER_ROLE")
);
const NEXT_SCORE = 10;

describe("Arena", () => {
  let Arena,
    to: string,
    owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    arenaContract: Arena,
    experiencePointsContract: ExperiencePoints;

  beforeEach(async () => {
    const ExperiencePointsFactory = await ethers.getContractFactory(
      "ExperiencePoints"
    );
    experiencePointsContract = await ExperiencePointsFactory.deploy();

    Arena = await ethers.getContractFactory("Arena");

    [owner, addr1, addr2] = await ethers.getSigners();
    to = addr1.address;
    arenaContract = await Arena.deploy(experiencePointsContract.address);

    await experiencePointsContract.grantRole(
      MINTER_ROLE,
      arenaContract.address
    );
  });

  it("Checks Signature", async function () {
    const hash = await arenaContract.getMessageHash(to, amount);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    expect(await arenaContract.verify(to, amount, sig)).to.equal(true);
  });

  it("Rejects verification with incorrect amount", async function () {
    const hash = await arenaContract.getMessageHash(to, amount);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    expect(await arenaContract.verify(to, amount + 1, sig)).to.equal(false);
  });

  it("Rejects external wallets generating signatures to give amounts to themselves", async function () {
    const hash = await arenaContract.getMessageHash(to, amount);

    const sig = await addr1.signMessage(ethers.utils.arrayify(hash));

    expect(await arenaContract.verify(to, amount, sig)).to.equal(false);
  });

  it("Rejects external wallets generating signatures to give amounts to others", async function () {
    const hash = await arenaContract.getMessageHash(addr2.address, amount);

    const sig = await addr1.signMessage(ethers.utils.arrayify(hash));

    // correct signature and message returns true

    expect(await arenaContract.verify(to, amount, sig)).to.equal(false);
  });

  it("Logs UserScores", async () => {
    await arenaContract.logGameScore(addr1.address, NEXT_SCORE);

    expect(await arenaContract.gameScores(to)).to.equal(NEXT_SCORE);

    await arenaContract.logGameScore(addr1.address, NEXT_SCORE);

    expect(await arenaContract.gameScores(to)).to.equal(NEXT_SCORE * 2);

    await arenaContract.logGameScore(addr1.address, 1);

    expect(await arenaContract.gameScores(to)).to.equal(NEXT_SCORE * 2 + 1);
  });

  it("Allows claiming of Prize", async () => {
    await arenaContract.logGameScore(to, NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(arenaContract.claimPrize(to, NEXT_SCORE, sig)).to.not.be
      .reverted;
  });

  it("Prevents claiming of prize by invalid signature", async () => {
    await arenaContract.logGameScore(to, NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await addr1.signMessage(ethers.utils.arrayify(hash));

    await expect(
      arenaContract.claimPrize(to, NEXT_SCORE, sig)
    ).to.be.revertedWith("Invalid Signature");
  });

  it("Prevents claiming of wrong prize amount", async () => {
    await arenaContract.logGameScore(to, NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(
      arenaContract.claimPrize(to, NEXT_SCORE + 1, sig)
    ).to.be.revertedWith("Invalid Signature");
  });

  it("Prevents claiming of prize amount for value not in first game score", async () => {
    await arenaContract.logGameScore(to, NEXT_SCORE);

    const wrongScore = NEXT_SCORE + 1;

    const hash = await arenaContract.getMessageHash(to, wrongScore);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(
      arenaContract.claimPrize(to, wrongScore, sig)
    ).to.be.revertedWith("Insufficient Claimable Points");
  });

  it("Prevents claiming when there is no game score logged", async () => {
    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(
      arenaContract.claimPrize(to, NEXT_SCORE, sig)
    ).to.be.revertedWith("Insufficient Claimable Points");
  });

  it("Prevents claiming when already previously claimed", async () => {
    await arenaContract.logGameScore(to, NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(arenaContract.claimPrize(to, NEXT_SCORE, sig)).to.not.be
      .reverted;

    await expect(
      arenaContract.claimPrize(to, NEXT_SCORE, sig)
    ).to.be.revertedWith("Insufficient Claimable Points");
  });

  it("Mints ExperiencePoints tokens upon claiming", async () => {
    expect(await experiencePointsContract.balanceOf(to)).to.equal(0);

    await arenaContract.logGameScore(to, NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(arenaContract.claimPrize(to, NEXT_SCORE, sig)).to.not.be
      .reverted;

    expect(await experiencePointsContract.balanceOf(to)).to.equal(NEXT_SCORE);
  });

  it("Allows claiming in batches", async () => {
    await arenaContract.logGameScore(to, 2 * NEXT_SCORE);

    const hash = await arenaContract.getMessageHash(to, NEXT_SCORE);

    const sig = await owner.signMessage(ethers.utils.arrayify(hash));

    await expect(arenaContract.claimPrize(to, NEXT_SCORE, sig)).to.not.be
      .reverted;

    await expect(arenaContract.claimPrize(to, NEXT_SCORE, sig)).to.not.be
      .reverted;

    expect(await experiencePointsContract.balanceOf(to)).to.equal(
      2 * NEXT_SCORE
    );
  });
});
