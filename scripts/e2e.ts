import {
  Debit,
  InitPreAuthorization,
  InitPreAuthorizationParams,
  InitPreAuthorizationVariant,
  InitSmartDelegate,
  PreAuthorizationVariant,
} from "@dcaf/pre-authorized-debit-v1";
import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { DebitParams } from "../sdk/pre-authorized-debit-v1/dist";

dotenv.config();

const PRE_AUTHORIZED_DEBIT_PROGRAM_ID = new PublicKey(
  "Debit3fDrmgHiJpc5rhxi1YjsWtbupdSLaCRE1Xk7fhT",
);

interface Config {
  signer: Keypair;
  connection: Connection;
}

const ENV_CONFIG = {
  SOLANA_KEYPAIR_PATH:
    process.env.SOLANA_KEYPAIR_PATH ?? new Error("SOLANA_KEYPAIR_PATH"),
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? new Error("SOLANA_RPC_URL"),
};

function loadConfigFromEnv(): Config {
  const envErrors = Object.values(ENV_CONFIG).filter((v) => v instanceof Error);
  if (envErrors.length > 0) {
    throw new Error(
      `Missing environemnt variables: [${envErrors
        .map((e) => (e as Error).message)
        .join(", ")}]`,
    );
  }

  const solanaKeypairPath = path.resolve(
    ENV_CONFIG.SOLANA_KEYPAIR_PATH as string,
  );

  const decodedKey = new Uint8Array(
    JSON.parse(fs.readFileSync(solanaKeypairPath).toString()),
  );
  const signer = Keypair.fromSecretKey(decodedKey);

  const connection = new Connection(ENV_CONFIG.SOLANA_RPC_URL as string, {
    commitment: "confirmed",
  });

  return {
    signer,
    connection,
  };
}

function deriveSmartDelegate(
  tokenAccount: PublicKey,
  programId: PublicKey,
): PublicKey {
  const [pdaPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("smart-delegate"), tokenAccount.toBuffer()],
    programId,
  );

  return pdaPubkey;
}

function derivePreAuthorization(
  tokenAccount: PublicKey,
  debitAuthority: PublicKey,
  programId: PublicKey,
): PublicKey {
  const [pdaPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pre-authorization"),
      tokenAccount.toBuffer(),
      debitAuthority.toBuffer(),
    ],
    programId,
  );
  return pdaPubkey;
}

export async function testDevnet() {
  const config = loadConfigFromEnv();
  console.log(
    `Testing against Solana Config: ${JSON.stringify(
      {
        genesisHash: await config.connection.getGenesisHash(),
        version: await config.connection.getVersion(),
        rpcEndpoint: config.connection.rpcEndpoint,
        signer: config.signer.publicKey,
        signerKeypairPath: ENV_CONFIG.SOLANA_KEYPAIR_PATH as string,
      },
      null,
      2,
    )}\n`,
  );

  const testMint = await createMint(
    config.connection,
    config.signer,
    config.signer.publicKey,
    null,
    6,
    undefined,
    {
      commitment: "confirmed",
    },
    TOKEN_PROGRAM_ID,
  );
  console.log(`Created test mint: ${testMint.toBase58()}`);

  const userKeypair = Keypair.generate();
  console.log(
    `Created a new user keypair: ${userKeypair.publicKey.toBase58()}`,
  );

  const userTestMintAta = await createAssociatedTokenAccount(
    config.connection,
    config.signer,
    testMint,
    userKeypair.publicKey,
    {
      commitment: "confirmed",
    },
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  console.log(
    `Created an ATA for the user (for test mint): ${userTestMintAta.toBase58()}`,
  );

  const txSig = await mintTo(
    config.connection,
    config.signer,
    testMint,
    userTestMintAta,
    config.signer,
    BigInt(1000e6),
    undefined,
    {
      commitment: "confirmed",
    },
    TOKEN_PROGRAM_ID,
  );
  console.log(`Minted user 1000 tokens (tx: ${txSig})`);

  const debitAuthorityKeypair = Keypair.generate();
  console.log(
    `Created a new debit authority: ${debitAuthorityKeypair.publicKey.toBase58()}`,
  );

  const debitAuthorityAta = await createAssociatedTokenAccount(
    config.connection,
    config.signer,
    testMint,
    debitAuthorityKeypair.publicKey,
    {
      commitment: "confirmed",
    },
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  console.log(
    `Created an ATA for the debit authority (for test mint): ${debitAuthorityAta.toBase58()}`,
  );

  const smartDelegate = deriveSmartDelegate(
    userTestMintAta,
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
  );
  const initSmartDelegateIx = new InitSmartDelegate(
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
    {
      args: null,
      accounts: {
        payer: config.signer.publicKey,
        owner: userKeypair.publicKey,
        tokenAccount: userTestMintAta,
        smartDelegate,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    },
  ).build();

  let blockhashInfo = await config.connection.getLatestBlockhash({
    commitment: "confirmed",
  });
  const initSmartDelegateTx = new Transaction({
    feePayer: config.signer.publicKey,
    ...blockhashInfo,
  }).add(initSmartDelegateIx);

  initSmartDelegateTx.sign(config.signer, userKeypair);

  const initSmartDelegateTxSig = await config.connection.sendRawTransaction(
    initSmartDelegateTx.serialize(),
  );
  await config.connection.confirmTransaction(
    {
      signature: initSmartDelegateTxSig,
      ...blockhashInfo,
    },
    "confirmed",
  );
  console.log(
    `Initialized smart delegate ${smartDelegate.toBase58()} (tx: ${initSmartDelegateTxSig})`,
  );

  const preAuthorization = derivePreAuthorization(
    userTestMintAta,
    debitAuthorityKeypair.publicKey,
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
  );
  const now = Math.floor(new Date().getTime() / 1e3);
  const initPreAuthorizationIx = new InitPreAuthorization(
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
    {
      args: {
        params: new InitPreAuthorizationParams({
          variant: new InitPreAuthorizationVariant.OneTime({
            amountAuthorized: BigInt(100e6),
            expiryUnixTimestamp: BigInt(now + 24 * 60 * 60),
          }),
          debitAuthority: debitAuthorityKeypair.publicKey,
          activationUnixTimestamp: BigInt(now - 60 * 60),
        }),
      },
      accounts: {
        payer: config.signer.publicKey,
        owner: userKeypair.publicKey,
        tokenAccount: userTestMintAta,
        preAuthorization,
        systemProgram: SystemProgram.programId,
      },
    },
  ).build();

  blockhashInfo = await config.connection.getLatestBlockhash();
  const initPreAuthorizationTx = new Transaction({
    feePayer: config.signer.publicKey,
    ...blockhashInfo,
  }).add(initPreAuthorizationIx);

  initPreAuthorizationTx.sign(config.signer, userKeypair);

  const initPreAuthorizationTxSig = await config.connection.sendRawTransaction(
    initPreAuthorizationTx.serialize(),
  );
  await config.connection.confirmTransaction(
    {
      signature: initPreAuthorizationTxSig,
      ...blockhashInfo,
    },
    "confirmed",
  );
  console.log(
    `Initialized pre-authorization ${preAuthorization.toBase58()} (tx: ${initPreAuthorizationTxSig})`,
  );

  const debitIx = new Debit(PRE_AUTHORIZED_DEBIT_PROGRAM_ID, {
    args: {
      params: new DebitParams({
        amount: BigInt(100e6),
      }),
    },
    accounts: {
      debitAuthority: debitAuthorityKeypair.publicKey,
      mint: testMint,
      tokenAccount: userTestMintAta,
      destinationTokenAccount: debitAuthorityAta,
      smartDelegate,
      preAuthorization,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  }).build();

  blockhashInfo = await config.connection.getLatestBlockhash();
  const debitTx = new Transaction({
    feePayer: config.signer.publicKey,
    ...blockhashInfo,
  }).add(debitIx);

  debitTx.sign(config.signer, debitAuthorityKeypair);

  const debitTxSig = await config.connection.sendRawTransaction(
    debitTx.serialize(),
  );
  await config.connection.confirmTransaction(
    {
      signature: debitTxSig,
      ...blockhashInfo,
    },
    "confirmed",
  );
  console.log(`Debited against pre-authorization (tx: ${debitTxSig})`);
}

if (require.main === module) {
  testDevnet()
    .then(() => console.log("Done"))
    .catch((e) => console.error("Failed:\n", e));
}
