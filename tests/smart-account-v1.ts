import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmartAccountV1 } from "../target/types/smart_account_v1";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("smart-account-v1", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SmartAccountV1 as Program<SmartAccountV1>;

    describe("init_smart_account_nonce", () => {
        it("initializes nonce to 0", async () => {
            const [smartAccountNoncePubkey] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("smart-account-nonce"),
                    program.provider.publicKey.toBuffer(),
                ],
                program.programId
            );

            await program.methods
                .initSmartAccountNonce()
                .accounts({
                    payer: program.provider.publicKey,
                    authority: program.provider.publicKey,
                    smartAccountNonce: smartAccountNoncePubkey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            const smartAccountNonce =
                await program.account.smartAccountNonce.fetch(
                    smartAccountNoncePubkey
                );

            expect({
                nonce: smartAccountNonce.nonce.toString(),
            }).to.deep.equal({
                nonce: "0",
            });
        });
    });
});
