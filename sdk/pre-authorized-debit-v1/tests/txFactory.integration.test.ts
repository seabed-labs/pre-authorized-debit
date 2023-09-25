import { Connection, Keypair } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
// import {AnchorProvider, Program} from "@coral-xyz/anchor";
// import {getProviderNodeWallet} from "./util";
import {
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
  InstructionFactoryImpl,
  TransactionFactoryImpl,
} from "../src";
import { createSandbox } from "sinon";
import { expect } from "chai";

describe("Transaction Factory Integration Tests", () => {
  const sandbox = createSandbox();

  const connection: Connection = new Connection(localValidatorUrl, "processed");
  // const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
  //   commitment: connection.commitment,
  // });
  // const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  const readClient = PreAuthorizedDebitReadClientImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
  );
  const ixFactory = InstructionFactoryImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
    readClient,
  );
  const txFactory = TransactionFactoryImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
    readClient,
    ixFactory,
  );

  afterEach(() => {
    sandbox.reset();
    sandbox.restore();
  });

  context("buildInitSmartDelegateTx", () => {
    it("should build tx", async () => {
      const payer = Keypair.generate().publicKey;
      const spyBuildInitSmartDelegateIx = sandbox.spy(
        ixFactory,
        "buildInitSmartDelegateIx",
      );
      const tx = await txFactory.buildInitSmartDelegateTx({
        payer,
      });
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildInitSmartDelegateIx.calledOnce).to.equal(true);
    });
  });

  xcontext("buildApproveSmartDelegateTx", () => {});

  xcontext("buildPausePreAuthorizationTx", () => {});
});
