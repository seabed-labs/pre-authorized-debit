import * as anchor from "@coral-xyz/anchor";
import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
use(chaiAsPromised);

import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";

const U64_MAX = "18446744073709551615";

describe("pre-authorized-debit-v1#debit", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const program = anchor.workspace
    .PreAuthorizedDebitV1 as anchor.Program<PreAuthorizedDebitV1>;

  let fundedKeypair: Keypair;
  let mintAuthorityKeypair: Keypair;
  let debitAuthorityKeypair: Keypair;
  let userKeypair: Keypair;
  let tokenAccountPubkey: PublicKey;
  let mintPubkey: PublicKey;
  let smartDelegatePubkey: PublicKey;
  let preAuthorizationPubkey: PublicKey;
  let destinationTokenAccountOwnerPubkey: PublicKey;
  let destinationTokenAccountPubkey: PublicKey;

  beforeEach(async () => {
    fundedKeypair = Keypair.generate();
    mintAuthorityKeypair = Keypair.generate();
    debitAuthorityKeypair = Keypair.generate();
    userKeypair = Keypair.generate();
    destinationTokenAccountOwnerPubkey = Keypair.generate().publicKey;

    const fundSolIx = SystemProgram.transfer({
      fromPubkey: provider.publicKey!,
      toPubkey: fundedKeypair.publicKey,
      lamports: 10e9,
    });

    const tx = new Transaction();
    tx.add(fundSolIx);

    await provider.sendAndConfirm!(tx);

    mintPubkey = await createMint(
      provider.connection,
      fundedKeypair,
      mintAuthorityKeypair.publicKey,
      null,
      6
    );

    tokenAccountPubkey = await createAssociatedTokenAccount(
      provider.connection,
      fundedKeypair,
      mintPubkey,
      userKeypair.publicKey
    );

    destinationTokenAccountPubkey = await createAssociatedTokenAccount(
      provider.connection,
      fundedKeypair,
      mintPubkey,
      destinationTokenAccountOwnerPubkey
    );

    await mintTo(
      provider.connection,
      fundedKeypair,
      mintPubkey,
      tokenAccountPubkey,
      mintAuthorityKeypair,
      1000e6
    );

    [smartDelegatePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("smart-delegate"), tokenAccountPubkey.toBuffer()],
      program.programId
    );

    await program.methods
      .initSmartDelegate()
      .accounts({
        payer: provider.publicKey!,
        owner: userKeypair.publicKey,
        tokenAccount: tokenAccountPubkey,
        smartDelegate: smartDelegatePubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
  });

  context("one time pre-authorization", () => {
    beforeEach(async () => {
      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 60;

      [preAuthorizationPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("pre-authorization"),
          tokenAccountPubkey.toBuffer(),
          debitAuthorityKeypair.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .initPreAuthorization({
          variant: {
            oneTime: {
              amountAuthorized: new anchor.BN(100e6),
              amountDebited: new anchor.BN(0),
              expiryUnixTimestamp: new anchor.BN(
                activationUnixTimestamp + 10 * 24 * 60 * 60
              ), // +10 days
            },
          },
          debitAuthority: debitAuthorityKeypair.publicKey,
          activationUnixTimestamp: new anchor.BN(activationUnixTimestamp),
        })
        .accounts({
          payer: provider.publicKey!,
          owner: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          preAuthorization: preAuthorizationPubkey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });

    it("allows debit_authority to debit funds", async () => {
      const sourceTokenAccountBefore = await getAccount(
        provider.connection,
        tokenAccountPubkey
      );

      const destinationTokenAccountBefore = await getAccount(
        provider.connection,
        destinationTokenAccountPubkey
      );

      const preAuthorizationBefore =
        await program.account.preAuthorization.fetch(preAuthorizationPubkey);

      expect(destinationTokenAccountBefore.amount.toString()).to.equal("0");

      expect(sourceTokenAccountBefore.amount.toString()).to.equal(
        (1000e6).toString()
      );
      expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
        smartDelegatePubkey.toBase58()
      );
      expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
        U64_MAX
      );

      expect(
        preAuthorizationBefore.variant.oneTime?.amountDebited.toString()
      ).to.equal("0");

      await program.methods
        .debit({ amount: new anchor.BN(50e6) })
        .accounts({
          debitAuthority: debitAuthorityKeypair.publicKey,
          mint: mintPubkey,
          tokenAccount: tokenAccountPubkey,
          destinationTokenAccount: destinationTokenAccountPubkey,
          smartDelegate: smartDelegatePubkey,
          preAuthorization: preAuthorizationPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([debitAuthorityKeypair])
        .rpc();

      const destinationTokenAccountAfter = await getAccount(
        provider.connection,
        destinationTokenAccountPubkey
      );

      const sourceTokenAccountAfter = await getAccount(
        provider.connection,
        tokenAccountPubkey
      );

      const preAuthorizationAfter =
        await program.account.preAuthorization.fetch(preAuthorizationPubkey);

      expect(destinationTokenAccountAfter.amount.toString()).to.equal(
        (50e6).toString()
      );
      expect(sourceTokenAccountAfter.amount.toString()).to.equal(
        (950e6).toString()
      );
      expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
        smartDelegatePubkey.toBase58()
      );
      expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
        (BigInt(U64_MAX) - BigInt(50e6)).toString()
      );

      expect(
        preAuthorizationAfter.variant.oneTime?.amountDebited.toString()
      ).to.equal((50e6).toString());

      expect({
        ...preAuthorizationBefore,
        variant: {
          oneTime: {
            ...preAuthorizationBefore.variant.oneTime,
            amountDebited: null,
          },
        },
      }).to.deep.equal({
        ...preAuthorizationAfter,
        variant: {
          oneTime: {
            ...preAuthorizationAfter.variant.oneTime,
            amountDebited: null,
          },
        },
      });
    });

    it("fails if pre_authorization is paused", async () => {
      await program.methods
        .updatePausePreAuthorization({
          pause: true,
        })
        .accounts({
          owner: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          preAuthorization: preAuthorizationPubkey,
        })
        .signers([userKeypair])
        .rpc();

      const preAuthorizationBefore =
        await program.account.preAuthorization.fetch(preAuthorizationPubkey);
      expect(preAuthorizationBefore.paused).to.equal(true);

      await expect(
        program.methods
          .debit({ amount: new anchor.BN(50e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([debitAuthorityKeypair])
          .rpc()
      ).to.eventually.be.rejectedWith(
        /Error Code: PreAuthorizationPaused. Error Number: 6004/
      );
    });

    it.skip("fires the DebitEvent event", async () => {});
  });
});
