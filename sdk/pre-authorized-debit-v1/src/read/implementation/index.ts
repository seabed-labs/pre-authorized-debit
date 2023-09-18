// TODO: Remove this after impl
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  ProgramAccount,
  utils,
} from "@coral-xyz/anchor";
import {
  Connection,
  GetProgramAccountsFilter,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  PDA,
  PreAuthorizationType,
  PreAuthorizedDebitReadClient,
} from "../interface";
import { DEVNET_PAD_PROGRAM_ID, MAINNET_PAD_PROGRAM_ID } from "../../constants";
import {
  IdlNotFoundOnChainError,
  TokenAccountDoesNotExist,
} from "../../errors";
import { PreAuthorizedDebitProgramIDL } from "../idl.ts";
import IDL from "../idl.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PreAuthorizationAccount, SmartDelegateAccount } from "../accounts.ts";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export class PreAuthorizedDebitReadClientImpl
  implements PreAuthorizedDebitReadClient
{
  private readonly program: Program<PreAuthorizedDebitProgramIDL>;

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
  ) {
    const readonlyProvider = new AnchorProvider(
      this.connection,
      new NodeWallet(Keypair.generate()),
      { commitment: this.connection.commitment },
    );

    this.program = new Program(
      IDL as PreAuthorizedDebitProgramIDL,
      this.programId,
    );
  }

  public static custom(
    connection: Connection,
    programId: PublicKey,
  ): PreAuthorizedDebitReadClient {
    return new PreAuthorizedDebitReadClientImpl(connection, programId);
  }

  public static mainnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      MAINNET_PAD_PROGRAM_ID,
    );
  }

  public static devnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      DEVNET_PAD_PROGRAM_ID,
    );
  }

  public async fetchIdlFromChain(): Promise<PreAuthorizedDebitProgramIDL> {
    const idl = await Program.fetchIdl<PreAuthorizedDebitProgramIDL>(
      this.programId,
      {
        connection: this.connection,
      },
    );

    if (!idl) {
      throw new IdlNotFoundOnChainError(
        this.connection.rpcEndpoint,
        this.programId,
      );
    }

    return idl;
  }

  public getSmartDelegatePDA(): PDA {
    const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("smart-delegate")],
      this.programId,
    );

    return { publicKey: pdaPubkey, bump: pdaBump };
  }

  public derivePreAuthorizationPDA(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PDA {
    const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pre-authorization"),
        tokenAccount.toBuffer(),
        debitAuthority.toBuffer(),
      ],
      this.programId,
    );

    return {
      publicKey: pdaPubkey,
      bump: pdaBump,
    };
  }

  private smartDelegateToNativeType(
    smartDelegateAnchorType: Awaited<
      ReturnType<typeof this.program.account.SmartDelegate.fetch>
    >,
  ): SmartDelegateAccount {
    return {
      bump: smartDelegateAnchorType.bump,
    };
  }

  private preAuthorizationToNativeType(
    preAuthorizationAnchorType: Awaited<
      ReturnType<typeof this.program.account.PreAuthorization.fetch>
    >,
  ): PreAuthorizationAccount {
    let variant: PreAuthorizationAccount["variant"];
    if (preAuthorizationAnchorType.variant.oneTime) {
      const oneTimeVariant = preAuthorizationAnchorType.variant.oneTime;

      variant = {
        oneTime: {
          amountAuthorized: BigInt(oneTimeVariant.amountAuthorized.toString()),
          amountDebited: BigInt(oneTimeVariant.amountDebited.toString()),
          expiryUnixTimestamp: BigInt(
            oneTimeVariant.expiryUnixTimestamp.toString(),
          ),
        },
      };
    } else {
      const recurringVariant = preAuthorizationAnchorType.variant.recurring;
      const numCycles = recurringVariant.numCycles;

      variant = {
        recurring: {
          recurringAmountAuthorized: BigInt(
            recurringVariant.recurringAmountAuthorized.toString(),
          ),
          repeatFrequencySeconds: BigInt(
            recurringVariant.repeatFrequencySeconds.toString(),
          ),
          resetEveryCycle: recurringVariant.resetEveryCycle,
          amountDebitedTotal: BigInt(
            recurringVariant.amountDebitedTotal.toString(),
          ),
          amountDebitedLastCycle: BigInt(
            recurringVariant.amountDebitedLastCycle.toString(),
          ),
          lastDebitedCycle: BigInt(
            recurringVariant.lastDebitedCycle.toString(),
          ),
          numCycles: numCycles && BigInt(numCycles.toString()),
        },
      };
    }

    return {
      bump: preAuthorizationAnchorType.bump,
      tokenAccount: preAuthorizationAnchorType.tokenAccount,
      debitAuthority: preAuthorizationAnchorType.debitAuthority,
      activationUnixTimestamp: BigInt(
        preAuthorizationAnchorType.activationUnixTimestamp.toString(),
      ),
      paused: preAuthorizationAnchorType.paused,
      variant,
    };
  }

  public async fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegateAccount> | null> {
    const { publicKey: smartDelegtePubkey } = this.getSmartDelegatePDA();

    const smartDelegateAccount =
      await this.program.account.SmartDelegate.fetchNullable(
        smartDelegtePubkey,
      );

    return (
      smartDelegateAccount && {
        publicKey: smartDelegtePubkey,
        account: this.smartDelegateToNativeType(smartDelegateAccount),
      }
    );
  }

  public async fetchPreAuthorization(
    params:
      | { publicKey: PublicKey }
      | { tokenAccount: PublicKey; debitAuthority: PublicKey },
  ): Promise<ProgramAccount<PreAuthorizationAccount> | null> {
    const maybePublicKeyParam = params as Partial<
      Extract<typeof params, { publicKey: PublicKey }>
    >;

    const maybeComponentParams = params as Exclude<
      typeof params,
      typeof maybePublicKeyParam
    >;

    const preAuthorizationPubkey =
      maybePublicKeyParam.publicKey ??
      this.derivePreAuthorizationPDA(
        maybeComponentParams.tokenAccount,
        maybeComponentParams.debitAuthority,
      ).publicKey;

    const preAuthorizationAccount =
      await this.program.account.PreAuthorization.fetchNullable(
        preAuthorizationPubkey,
      );

    return (
      preAuthorizationAccount && {
        publicKey: preAuthorizationPubkey,
        account: this.preAuthorizationToNativeType(preAuthorizationAccount),
      }
    );
  }

  private async fetchPreAuthorizations(
    type: PreAuthorizationType,
    filterBy: {
      tokenAccount?: PublicKey;
      debitAuthority?: PublicKey;
    },
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    // TODO: Support pagination?
    // TODO: After test, make this code more dynamic (i.e. use IDL and anchor convenience functions instead of doing it raw)

    // TODO: After test, make this code more dynamic (i.e. use IDL and anchor convenience functions instead of doing it raw)

    const filters: GetProgramAccountsFilter[] = [];

    if (filterBy.tokenAccount) {
      filters.push({
        // tokenAccount
        memcmp: {
          offset: 10,
          bytes: filterBy.tokenAccount.toBase58(),
        },
      });
    }

    if (filterBy.debitAuthority) {
      filters.push({
        // debitAuthority
        memcmp: {
          offset: 93,
          bytes: filterBy.debitAuthority.toBase58(),
        },
      });
    }

    if (type === "oneTime") {
      filters.push({
        // PreAuthorizationVariant::OneTime (discriminator)
        memcmp: {
          offset: 42,
          bytes: utils.bytes.bs58.encode(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])),
        },
      });
    } else if (type === "recurring") {
      filters.push({
        // PreAuthorizationVariant::Recurring (discriminator)
        memcmp: {
          offset: 42,
          bytes: utils.bytes.bs58.encode(Buffer.from([0, 0, 0, 0, 0, 0, 0, 1])),
        },
      });
    }

    const programAccounts =
      await this.program.account.PreAuthorization.all(filters);

    return programAccounts.map((programAccount) => ({
      publicKey: programAccount.publicKey,
      account: this.preAuthorizationToNativeType(programAccount.account),
    }));
  }

  // TODO: Support pagination?
  public async fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
    type: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    return this.fetchPreAuthorizations(type, { tokenAccount });
  }

  // TODO: Support pagination?
  public async fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
    type: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]> {
    return this.fetchPreAuthorizations(type, { debitAuthority });
  }

  public async checkDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
    amount: bigint;
  }): Promise<boolean> {
    const { tokenAccount: tokenAccountPubkey, debitAuthority, amount } = params;
    const preAuthorization = await this.fetchPreAuthorization({
      tokenAccount: tokenAccountPubkey,
      debitAuthority,
    });

    const tokenAccountInfo =
      await this.connection.getAccountInfo(tokenAccountPubkey);

    const tokenProgramId = tokenAccountInfo?.owner;

    if (
      tokenAccountInfo == null ||
      tokenProgramId == null || // for typescript
      ![TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].includes(tokenProgramId)
    ) {
      throw new TokenAccountDoesNotExist(
        this.connection.rpcEndpoint,
        tokenAccountPubkey,
      );
    }

    if (preAuthorization == null) {
      return false;
    }

    const tokenAccount = await getAccount(
      this.connection,
      tokenAccountPubkey,
      undefined,
      tokenProgramId,
    );

    // NOTE: The debit authority can debit to any token account.
    //       But, we just use the ATA to keep this method's interface simple.
    const debitAuthortyAta = getAssociatedTokenAddressSync(
      tokenAccount.mint,
      debitAuthority,
      true,
      tokenProgramId,
    );

    const { publicKey: smartDelegate } = this.getSmartDelegatePDA();

    const simulationRes = await this.program.methods
      .debit({
        amount: new BN(amount.toString()),
      })
      .accounts({
        debitAuthority,
        mint: tokenAccount.mint,
        tokenAccount: tokenAccountPubkey,
        destinationTokenAccount: debitAuthortyAta,
        smartDelegate,
        preAuthorization: preAuthorization.publicKey,
        tokenProgram: tokenProgramId,
      })
      .simulate();

    const debitOccured = simulationRes.events.some(
      (event) => event.name === "DebitEvent",
    );

    return debitOccured;
  }

  fetchMaxDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
  }): Promise<bigint> {
    // TODO
    throw new Error("Method not implemented.");
  }
}
