import "../setup";
import * as anchor from "@coral-xyz/anchor";
import { assert, expect, use } from "chai";

import { PreAuthorizedDebitV1 } from "../../../target/types/pre_authorized_debit_v1";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import {
  derivePreAuthorization,
  deriveSmartDelegate,
  fundAccounts,
  waitForTxToConfirm,
} from "../utils";

const U64_MAX = "18446744073709551615";

export function testOneTimeDebit(
  tokenProgramId: PublicKey,
  testSuffix: string,
) {
  describe(`pre-authorized-debit-v1#debit (one-time) ${testSuffix}`, () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;

    const program = anchor.workspace
      .PreAuthorizedDebitV1 as anchor.Program<PreAuthorizedDebitV1>;

    const eventParser = new anchor.EventParser(
      program.programId,
      new anchor.BorshCoder(program.idl),
    );

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

    async function setupPreAuthorization(
      activationUnixTimestamp: number,
      expirationUnixTimestamp: number,
    ) {
      preAuthorizationPubkey = derivePreAuthorization(
        tokenAccountPubkey,
        debitAuthorityKeypair.publicKey,
        program.programId,
      );

      await program.methods
        .initPreAuthorization({
          variant: {
            oneTime: {
              amountAuthorized: new anchor.BN(100e6),
              expiryUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
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
    }

    beforeEach(async () => {
      fundedKeypair = Keypair.generate();
      mintAuthorityKeypair = Keypair.generate();
      debitAuthorityKeypair = Keypair.generate();
      userKeypair = Keypair.generate();
      destinationTokenAccountOwnerPubkey = Keypair.generate().publicKey;

      await fundAccounts(provider, [fundedKeypair.publicKey], 10e9);

      mintPubkey = await createMint(
        provider.connection,
        fundedKeypair,
        mintAuthorityKeypair.publicKey,
        null,
        6,
        undefined,
        undefined,
        tokenProgramId,
      );

      tokenAccountPubkey = await createAssociatedTokenAccount(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        userKeypair.publicKey,
        undefined,
        tokenProgramId,
      );

      destinationTokenAccountPubkey = await createAssociatedTokenAccount(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        destinationTokenAccountOwnerPubkey,
        undefined,
        tokenProgramId,
      );

      await mintTo(
        provider.connection,
        fundedKeypair,
        mintPubkey,
        tokenAccountPubkey,
        mintAuthorityKeypair,
        1000e6,
        undefined,
        undefined,
        tokenProgramId,
      );

      smartDelegatePubkey = deriveSmartDelegate(
        tokenAccountPubkey,
        program.programId,
      );

      await program.methods
        .initSmartDelegate()
        .accounts({
          payer: provider.publicKey!,
          owner: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          smartDelegate: smartDelegatePubkey,
          tokenProgram: tokenProgramId,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now

      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

      await setupPreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
      );
    });

    it("allows debit_authority to debit funds", async () => {
      const sourceTokenAccountBefore = await getAccount(
        provider.connection,
        tokenAccountPubkey,
        undefined,
        tokenProgramId,
      );

      const destinationTokenAccountBefore = await getAccount(
        provider.connection,
        destinationTokenAccountPubkey,
        undefined,
        tokenProgramId,
      );

      const preAuthorizationBefore =
        await program.account.preAuthorization.fetch(preAuthorizationPubkey);

      expect(destinationTokenAccountBefore.amount.toString()).to.equal("0");
      expect(sourceTokenAccountBefore.amount.toString()).to.equal(
        (1000e6).toString(),
      );
      expect(sourceTokenAccountBefore.delegate?.toBase58()).to.equal(
        smartDelegatePubkey.toBase58(),
      );
      expect(sourceTokenAccountBefore.delegatedAmount.toString()).to.equal(
        U64_MAX,
      );
      expect(
        preAuthorizationBefore.variant.oneTime?.amountDebited.toString(),
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
          tokenProgram: tokenProgramId,
        })
        .signers([debitAuthorityKeypair])
        .rpc();

      const destinationTokenAccountAfter = await getAccount(
        provider.connection,
        destinationTokenAccountPubkey,
        undefined,
        tokenProgramId,
      );
      const sourceTokenAccountAfter = await getAccount(
        provider.connection,
        tokenAccountPubkey,
        undefined,
        tokenProgramId,
      );

      const preAuthorizationAfter =
        await program.account.preAuthorization.fetch(preAuthorizationPubkey);

      expect(destinationTokenAccountAfter.amount.toString()).to.equal(
        (50e6).toString(),
      );
      expect(sourceTokenAccountAfter.amount.toString()).to.equal(
        (950e6).toString(),
      );
      expect(sourceTokenAccountAfter.delegate?.toBase58()).to.equal(
        smartDelegatePubkey.toBase58(),
      );
      expect(sourceTokenAccountAfter.delegatedAmount.toString()).to.equal(
        (BigInt(U64_MAX) - BigInt(50e6)).toString(),
      );
      expect(
        preAuthorizationAfter.variant.oneTime?.amountDebited.toString(),
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
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc(),
      ).to.eventually.be.rejectedWith(
        /Error Code: PreAuthorizationPaused. Error Number: 6004/,
      );
    });

    it("fails if pre_authorization is not yet active", async () => {
      await program.methods
        .closePreAuthorization()
        .accounts({
          receiver: userKeypair.publicKey,
          authority: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          preAuthorization: preAuthorizationPubkey,
        })
        .signers([userKeypair])
        .rpc();

      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) + 24 * 60 * 60; // +1 day from now

      const expirationUnixTimestamp =
        activationUnixTimestamp + 10 * 24 * 60 * 60; // +11 days from now

      await setupPreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
      );

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
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc(),
      ).to.eventually.be.rejectedWith(
        /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
      );
    });

    it("fails if pre_authorization is already expired", async () => {
      await program.methods
        .closePreAuthorization()
        .accounts({
          receiver: userKeypair.publicKey,
          authority: userKeypair.publicKey,
          tokenAccount: tokenAccountPubkey,
          preAuthorization: preAuthorizationPubkey,
        })
        .signers([userKeypair])
        .rpc();

      const activationUnixTimestamp =
        Math.floor(new Date().getTime() / 1e3) - 24 * 60 * 60; // -1 day from now

      const expirationUnixTimestamp =
        activationUnixTimestamp + 24 * 60 * 60 - 1; // -1 second from now

      await setupPreAuthorization(
        activationUnixTimestamp,
        expirationUnixTimestamp,
      );

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
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc(),
      ).to.eventually.be.rejectedWith(
        /Error Code: PreAuthorizationNotActive. Error Number: 6000/,
      );
    });

    it("fails if attempting to debit more than pre_authorization inital authorization", async () => {
      await expect(
        program.methods
          .debit({ amount: new anchor.BN(101e6) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc(),
      ).to.eventually.be.rejectedWith(
        /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001/,
      );
    });

    it("fails if attempting to debit more than pre_authorization's remaining available amount", async () => {
      await program.methods
        .debit({ amount: new anchor.BN(100e6) })
        .accounts({
          debitAuthority: debitAuthorityKeypair.publicKey,
          mint: mintPubkey,
          tokenAccount: tokenAccountPubkey,
          destinationTokenAccount: destinationTokenAccountPubkey,
          smartDelegate: smartDelegatePubkey,
          preAuthorization: preAuthorizationPubkey,
          tokenProgram: tokenProgramId,
        })
        .signers([debitAuthorityKeypair])
        .rpc();

      await expect(
        program.methods
          .debit({ amount: new anchor.BN(1) })
          .accounts({
            debitAuthority: debitAuthorityKeypair.publicKey,
            mint: mintPubkey,
            tokenAccount: tokenAccountPubkey,
            destinationTokenAccount: destinationTokenAccountPubkey,
            smartDelegate: smartDelegatePubkey,
            preAuthorization: preAuthorizationPubkey,
            tokenProgram: tokenProgramId,
          })
          .signers([debitAuthorityKeypair])
          .rpc(),
      ).to.eventually.be.rejectedWith(
        /Error Code: CannotDebitMoreThanAvailable. Error Number: 6001/,
      );
    });

    it("fires the DebitEvent event", async () => {
      const signature = await program.methods
        .debit({ amount: new anchor.BN(50e6) })
        .accounts({
          debitAuthority: debitAuthorityKeypair.publicKey,
          mint: mintPubkey,
          tokenAccount: tokenAccountPubkey,
          destinationTokenAccount: destinationTokenAccountPubkey,
          smartDelegate: smartDelegatePubkey,
          preAuthorization: preAuthorizationPubkey,
          tokenProgram: tokenProgramId,
        })
        .signers([debitAuthorityKeypair])
        .rpc();
      const tx = await waitForTxToConfirm(signature, provider.connection);

      assert(tx, "tx undefined");
      assert(tx.meta?.logMessages, "tx.meta?.logMessages undefined");

      const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
      const events = [...eventGenerator];
      expect(events.length).to.equal(1);
      const [debitEvent] = events;
      expect(debitEvent.name).to.equal("DebitEvent");
      expect(Object.keys(debitEvent.data).length).to.equal(9);
      expect(debitEvent.data.preAuthorization!.toString()).to.equal(
        preAuthorizationPubkey.toBase58(),
      );
      expect(debitEvent.data.smartDelegate!.toString()).to.equal(
        smartDelegatePubkey.toBase58(),
      );
      expect(debitEvent.data.mint!.toString()).to.equal(mintPubkey.toBase58());
      expect(debitEvent.data.tokenProgram!.toString()).to.equal(
        tokenProgramId.toBase58(),
      );
      expect(debitEvent.data.sourceTokenAccountOwner!.toString()).to.equal(
        userKeypair.publicKey.toBase58(),
      );
      expect(debitEvent.data.destinationTokenAccountOwner!.toString()).to.equal(
        destinationTokenAccountOwnerPubkey.toBase58(),
      );
      expect(debitEvent.data.sourceTokenAccount!.toString()).to.equal(
        tokenAccountPubkey.toBase58(),
      );
      expect(debitEvent.data.destinationTokenAccount!.toString()).to.equal(
        destinationTokenAccountPubkey.toBase58(),
      );
      expect(
        (debitEvent.data.debitAuthorizationType as any).oneTime,
      ).to.deep.equal({});
    });
  });
}
