import { program, eventParser, provider } from "./setup";

import { assert, expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { deriveInvalidSmartDelegate } from "./utils";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {
  deriveSmartDelegate,
  fundAccounts,
  waitForTxToConfirm,
} from "@dcaf/pad-test-utils";

describe("pre-authorized-debit-v1#init-smart-delegate", () => {
  const [canonicalSmartDelegatePublicKey, canonicalSmartDelegateBump] =
    deriveSmartDelegate(program.programId);

  let payer: Keypair;

  before(async () => {
    payer = Keypair.generate();

    await fundAccounts(provider, [payer.publicKey], 500e6);
  });

  it("should throw an error with a non-canonical smart delegate", async () => {
    const invalidSmartDelegate = deriveInvalidSmartDelegate(program.programId);
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          smartDelegate: invalidSmartDelegate,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: smart_delegate. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated./,
    );
  });

  it("should throw an error with an invalid system program id", async () => {
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          smartDelegate: canonicalSmartDelegatePublicKey,
          systemProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /AnchorError caused by account: system_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected./,
    );
  });

  it("should create a smart delegate", async () => {
    const [payerAccountInfoBefore] =
      await provider.connection.getMultipleAccountsInfo([payer.publicKey]);
    assert(payerAccountInfoBefore);

    const signature = await program.methods
      .initSmartDelegate()
      .accounts({
        payer: payer.publicKey,
        smartDelegate: canonicalSmartDelegatePublicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    const tx = await waitForTxToConfirm(signature, provider.connection);
    assert(tx.meta?.logMessages);

    // verify events
    const eventGenerator = eventParser.parseLogs(tx.meta.logMessages);
    const events = [...eventGenerator];
    expect(events.length).to.equal(1);
    const [smartDelegateEvent] = events;
    expect(smartDelegateEvent).to.not.equal(null);
    expect(smartDelegateEvent.name).to.equal("SmartDelegateInitialized");
    expect(Object.keys(smartDelegateEvent.data).length).to.equal(2);
    expect(smartDelegateEvent.data.payer!.toString()).to.equal(
      payer.publicKey.toString(),
    );
    expect(smartDelegateEvent.data.smartDelegate!.toString()).to.equal(
      canonicalSmartDelegatePublicKey.toString(),
    );

    // verify sol balances
    const [payerAccountInfoAfter] =
      await provider.connection.getMultipleAccountsInfo([payer.publicKey]);
    assert(payerAccountInfoAfter);
    expect(payerAccountInfoAfter.lamports).to.be.lessThan(
      payerAccountInfoBefore.lamports,
    );

    // verify smart delegate account
    const smartDelegateAccount = await program.account.smartDelegate.fetch(
      canonicalSmartDelegatePublicKey,
    );
    expect(smartDelegateAccount.bump).to.equal(canonicalSmartDelegateBump);
  });

  it("should fail if trying to init a smart delegate twice", async () => {
    await expect(
      program.methods
        .initSmartDelegate()
        .accounts({
          payer: payer.publicKey,
          smartDelegate: canonicalSmartDelegatePublicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer])
        .rpc(),
    ).to.eventually.to.be.rejectedWith(
      /Error processing Instruction 0: custom program error: 0x0/,
    );
  });
});
