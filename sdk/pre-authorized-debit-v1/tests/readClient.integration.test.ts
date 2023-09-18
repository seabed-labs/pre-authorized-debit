import { assert, expect } from "chai";
import { Connection } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import {
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
} from "../src";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { getProviderNodeWallet, initSmartDelegateIdempotent } from "./util";
describe("PreAuthorizedDebitReadClientImpl", () => {
  const connection: Connection = new Connection(localValidatorUrl);
  const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
    commitment: "confirmed",
  });
  const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  console.log(program.programId.toString());
  const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);

  beforeAll(async () => {
    await initSmartDelegateIdempotent(program);
  });

  it("should fetch smartDelegate", async () => {
    const smartDelegate = await readClient.fetchSmartDelegate();
    assert.isNotEmpty(smartDelegate);
    expect(smartDelegate!.publicKey.toString()).to.equal(
      "5xwfb7dPwdbgnMFABbF9mqYaD79ocSngiR9GMSY9Tfzb",
    );
    expect(smartDelegate!.account.bump).to.equal(255);
  });
});
