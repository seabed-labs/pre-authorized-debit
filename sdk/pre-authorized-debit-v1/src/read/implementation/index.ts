// TODO: Remove this after impl
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Idl, Program, ProgramAccount, utils } from "@coral-xyz/anchor";
import {
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from "@solana/web3.js";
import {
  SmartDelegate,
  PreAuthorization,
  SmartDelegateAccount,
  PreAuthorizationAccount,
} from "../../anchor-client";
import {
  PDA,
  PreAuthorizationType,
  PreAuthorizedDebitReadClient,
} from "../interface";
import { DEVNET_PAD_PROGRAM_ID, MAINNET_PAD_PROGRAM_ID } from "../../constants";
import { IdlNotFoundOnChainError } from "../../errors";

export class PreAuthorizedDebitReadClientImpl
  implements PreAuthorizedDebitReadClient
{
  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
  ) {}

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

  public async fetchIdl(): Promise<Idl> {
    const idl = await Program.fetchIdl(this.programId);

    if (!idl) {
      throw new IdlNotFoundOnChainError(this.programId);
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

  public async fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegateAccount> | null> {
    const { publicKey: smartDelegtePubkey } = this.getSmartDelegatePDA();

    const smartDelegateAccount = await SmartDelegate.fetch(
      this.connection,
      smartDelegtePubkey,
      this.programId,
    );

    return (
      smartDelegateAccount && {
        publicKey: smartDelegtePubkey,
        account: smartDelegateAccount.data,
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

    const preAuthorizationAccount = await PreAuthorization.fetch(
      this.connection,
      preAuthorizationPubkey,
      this.programId,
    );

    return (
      preAuthorizationAccount && {
        publicKey: preAuthorizationPubkey,
        account: preAuthorizationAccount.data,
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

    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 133,
      },
      {
        // discriminator
        memcmp: {
          offset: 0,
          bytes: utils.bytes.bs58.encode(PreAuthorization.discriminator),
        },
      },
    ];

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

    // TODO: Is it really better to do 2 RPC calls rather than 1 (just getProgramAccounts) here?

    // TODO: Abstract some of this out
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      // we don't want any data since we just care about pubkeys for now
      dataSlice: {
        offset: 0,
        length: 0,
      },
      filters,
    });

    const accountPubkeys = accounts.map((a) => a.pubkey);
    const accountInfos =
      await this.connection.getMultipleAccountsInfo(accountPubkeys);

    const parsedProgramAccounts = accountInfos
      .map((info, i): ProgramAccount<PreAuthorizationAccount> | null => {
        return (
          info && {
            publicKey: accountPubkeys[i],
            account: PreAuthorization.decode(info.data).data,
          }
        );
      })
      .filter(
        (val): val is ProgramAccount<PreAuthorizationAccount> => val !== null,
      );

    return parsedProgramAccounts;
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

  checkDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
    amount: bigint;
  }): Promise<boolean> {
    // TODO
    throw new Error("Method not implemented.");
  }

  fetchMaxDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
  }): Promise<bigint> {
    // TODO
    throw new Error("Method not implemented.");
  }
}
