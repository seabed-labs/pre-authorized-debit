export type PreAuthorizedDebitV1 = {
  version: "1.0.0";
  name: "pre_authorized_debit_v1";
  instructions: [
    {
      name: "initSmartDelegate";
      docs: [
        "The `InitSmartDelegate` instruction will create a global `smart_delegate` account.\n\n    Initializes a new account (`smart_delegate`).\n    The `smart_delegate` PDA is used by the `pre_authorized_debit` program to sign for\n    valid pre-authorized debits to transfer funds from the `pre_authorization.token_account`.\n    The `smart_delegate` account can NEVER be closed.\n\n    The `payer` MUST sign the transaction.\n    The `payer` MUST have enough lamports to pay for the `smart_delegate` account.\n\n    Accounts expected by this instruction:\n        0. `[writable]` payer\n        1. `[writable]` smart_delegate\n        2. `[]`         system_program",
      ];
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "smartDelegate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "initPreAuthorization";
      docs: [
        "The `InitPreAuthorization` instruction will create a `pre_authorization` account.\n\n    Initializes a new account (`pre_authorization`).\n    The `pre_authorization` defines a set of rules.\n    The `pre_authorization` rules/constraints are verified during a `debit` instruction.\n    The `pre_authorization` in conjunction with a `smart_delegate` for the same `token_account`\n    can allow the `pre_authorization.debit_authority` to do a one-time or recurring debit from the\n    `token_account.\n    For a pair of `debit_authority` and `token_account`, only a single `pre_authorization` account can exist.\n    To create another `pre_authorization` for the same `token_account`, another `debit_authority` must be used.\n\n    The `payer` MUST sign the transaction.\n    The `payer` MUST have enough lamports to pay for the `pre_authorization` account.\n    The `owner` MUST sign the transaction.\n    The `owner` MUST be the `token_account.owner`.\n    The `payer` and `owner` may be the same account.\n    The `token_account.owner` MUST be the `owner`.\n    The `pre_authorization.token_account` must be the same as `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` payer\n        1. `[]`         owner\n        2. `[writable]` token_account\n        3. `[writable]` pre_authorization\n        4. `[]`         system_program",
      ];
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "smartDelegate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "preAuthorization";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: "InitPreAuthorizationParams";
          };
        },
      ];
    },
    {
      name: "closePreAuthorization";
      docs: [
        "The `ClosePreAuthorization` instruction will close a `pre_authorization` account.\n\n    Closes an existing `pre_authorization` account and refunds the lamports\n    to the `token_account.owner` (`receiver`).\n\n    The `receiver` will receive all lamports from the closed account.\n    The `receiver` MUST be the `token_account.owner`.\n    The `authority` MUST sign for the instruction.\n    The `authority` MUST be either the `token_account.owner` or the `pre_authorization.debit_authority`.\n    The `owner` MUST be the `token_account.owner`.\n    The `token_account.owner` MUST be the `owner`.\n    The `pre_authorization.token_account` must be the same as `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` receiver\n        1. `[]`         authority\n        2. `[]`         token_account\n        3. `[writable]` pre_authorization",
      ];
      accounts: [
        {
          name: "receiver";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "tokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "preAuthorization";
          isMut: true;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "debit";
      docs: [
        "The `Debit` instruction allows a `pre_authorization.debit_authority` to debit from the\n    `pre_authorization.token_account` via the `smart_delegate` PDA. To successfully debit from\n    the `token_account`, the constraints for the `pre_authorization` must be met.\n\n    Definitions:\n      - PA = pre_authorization\n\n    Common Rules:\n    - The `pre_authorization` MUST not be paused.\n    - The amount being requested to debit must be less than or equal to the available amount for the current_cycle\n    - The current timestamp must be less than the `PA.expiry_unix_timestamp`\n    - If the PA has a `num_cycles` defined, the `current_cycle` must be less than or equal to `PA.num_cycles`\n\n    For a recurring pre-authorization:\n    - The debit_authority must not have already done a debit in the current cycle\n\n    For a one-time pre-authorization:\n    - the validator time must be greater than or equal to the `pre_authorization.activation_unix_timestamp`\n\n    For a more in-depth understanding around the constraints in a debit, it is recommended to read through\n    the validation done for a `debit` instruction.\n\n    The `debit_authority` MUST sign the transaction.\n    The `debit_authority` MUST equal the `pre_authorization.debit_authority`.\n    The `mint` MUST equal `token_account.mint` and `destination_token_account.mint`.\n    The `token_account.delegate` MUST equal the `smart_delegate`.\n    The `token_account.mint` MUST equal the `mint`.\n    The `destination_token_account.mint` MUST equal `mint`.\n    The `pre_authorization.token_account` MUST equal the `token_account`.\n    The `token_program` MUST equal the token program matching the `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[]`         debit_authority\n        1. `[]`         mint\n        2. `[writable]` token_account\n        3. `[writable]` destination_token_account\n        4. `[]`         smart_delegate\n        5. `[writable]` pre_authorization\n        6. `[]`         token_program",
      ];
      accounts: [
        {
          name: "debitAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "destinationTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "smartDelegate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "preAuthorization";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: "DebitParams";
          };
        },
      ];
    },
    {
      name: "updatePausePreAuthorization";
      docs: [
        "The `UpdatePausePreAuthorization` instruction allows a `token_account.owner` to pause a\n    `pre_authorization`.\n\n    The `owner` MUST sign the transaction.\n    The `owner` MUST equal the `token_account.owner`.\n    The `token_account.owner` MUST equal the `owner`.\n    The `pre_authorization.token_account` MUST equal the `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` owner\n        2. `[]`         token_account\n        3. `[writable]` pre_authorization",
      ];
      accounts: [
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "tokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "preAuthorization";
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: "UpdatePausePreAuthorizationParams";
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "preAuthorization";
      docs: [
        "The `pre_authorization` is a PDA account derived with the seeds:\n ['pre-authorization', token_account, debit_authority].\n The `pre_authorization` can be thought of as the rule for the `smart_delegate`.\n The `pre_authorization` can be used to validate a recurring or one-time debit from the `token_account`.\n The `smart_delegate` will validate the rules of the `pre_authorization` in the `debit` instruction.\n A `pre_authorization` is associated many:1 with a `token_account`,\n however, for a given `debit_authority` and `token_account` there can only be one `pre_authorization`.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: [
              "The `bump` is the canonical PDA bump when derived with seeds:\n      ['pre-authorization', token_account, debit_authority].\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ];
            type: "u8";
          },
          {
            name: "paused";
            docs: [
              "If `paused === true`, then the `debit_authority` cannot debit via the `token_account`.\n      This field is initialized to `false` in `init_pre_authorization`.\n      This field can be updated by the `token_account.owner` in `update_pause_pre_authorization`.\n      Note that recurring rebits that accrue the amounts across cycles will continue to do so while paused\n        (close the pre-authorization to stop this).",
            ];
            type: "bool";
          },
          {
            name: "tokenAccount";
            docs: [
              "The `token_account` is the account the `debit_authority` will be able to debit from.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ];
            type: "publicKey";
          },
          {
            name: "variant";
            docs: [
              "The `variant` contains the data specific to a one-time\n      or recurring debit.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ];
            type: {
              defined: "PreAuthorizationVariant";
            };
          },
          {
            name: "debitAuthority";
            docs: [
              "The `debit_authority` is the signer that can debit from the `token_account`.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ];
            type: "publicKey";
          },
          {
            name: "activationUnixTimestamp";
            docs: [
              "The `activation_unix_timestamp` represents when the pre-authorization becomes active (i.e. debits can occur).\n      The field is initialized in `init_pre_authorization`.",
            ];
            type: "i64";
          },
        ];
      };
    },
    {
      name: "smartDelegate";
      docs: [
        "The `smart_delegate` is a PDA account derived with the seeds:\n  ['smart-delegate'].\n  The `smart_delegate` should be set as the delegate of any\n  `token_account` specified in a `pre_authorization`.\n  The `smart_delegate` is a global account and is only initialized once.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: [
              "The `bump` is the canonical PDA bump when derived with seeds:\n      ['smart-delegate'].\n      This field is initialized in `init_smart_delegate`.\n      This field is never updated in any instruction.",
            ];
            type: "u8";
          },
        ];
      };
    },
  ];
  types: [
    {
      name: "PreAuthorizationClosedEventData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "debitAuthority";
            type: "publicKey";
          },
          {
            name: "closingAuthority";
            type: "publicKey";
          },
          {
            name: "tokenAccountOwner";
            type: "publicKey";
          },
          {
            name: "receiver";
            type: "publicKey";
          },
          {
            name: "tokenAccount";
            type: "publicKey";
          },
          {
            name: "preAuthorization";
            type: "publicKey";
          },
        ];
      };
    },
    {
      name: "DebitParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "InitPreAuthorizationParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "variant";
            type: {
              defined: "InitPreAuthorizationVariant";
            };
          },
          {
            name: "debitAuthority";
            type: "publicKey";
          },
          {
            name: "activationUnixTimestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "PreAuthorizationCreatedEventData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "debitAuthority";
            type: "publicKey";
          },
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "payer";
            type: "publicKey";
          },
          {
            name: "tokenAccount";
            type: "publicKey";
          },
          {
            name: "preAuthorization";
            type: "publicKey";
          },
          {
            name: "initParams";
            type: {
              defined: "InitPreAuthorizationParams";
            };
          },
        ];
      };
    },
    {
      name: "UpdatePausePreAuthorizationParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pause";
            type: "bool";
          },
        ];
      };
    },
    {
      name: "PausePreAuthorizationEventData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "tokenAccount";
            type: "publicKey";
          },
          {
            name: "preAuthorization";
            type: "publicKey";
          },
          {
            name: "newPausedValue";
            type: "bool";
          },
        ];
      };
    },
    {
      name: "DebitEventVariant";
      type: {
        kind: "enum";
        variants: [
          {
            name: "OneTime";
            fields: [
              {
                name: "debit_amount";
                type: "u64";
              },
            ];
          },
          {
            name: "Recurring";
            fields: [
              {
                name: "debit_amount";
                type: "u64";
              },
              {
                name: "cycle";
                type: "u64";
              },
            ];
          },
        ];
      };
    },
    {
      name: "InitPreAuthorizationVariant";
      type: {
        kind: "enum";
        variants: [
          {
            name: "OneTime";
            fields: [
              {
                name: "amount_authorized";
                type: "u64";
              },
              {
                name: "expiry_unix_timestamp";
                type: "i64";
              },
            ];
          },
          {
            name: "Recurring";
            fields: [
              {
                name: "repeat_frequency_seconds";
                type: "u64";
              },
              {
                name: "recurring_amount_authorized";
                type: "u64";
              },
              {
                name: "num_cycles";
                type: {
                  option: "u64";
                };
              },
              {
                name: "reset_every_cycle";
                type: "bool";
              },
            ];
          },
        ];
      };
    },
    {
      name: "PreAuthorizationVariant";
      type: {
        kind: "enum";
        variants: [
          {
            name: "OneTime";
            fields: [
              {
                name: "amount_authorized";
                type: "u64";
              },
              {
                name: "expiry_unix_timestamp";
                type: "i64";
              },
              {
                name: "amount_debited";
                type: "u64";
              },
            ];
          },
          {
            name: "Recurring";
            fields: [
              {
                name: "repeat_frequency_seconds";
                type: "u64";
              },
              {
                name: "recurring_amount_authorized";
                type: "u64";
              },
              {
                name: "amount_debited_last_cycle";
                type: "u64";
              },
              {
                name: "amount_debited_total";
                type: "u64";
              },
              {
                name: "last_debited_cycle";
                type: "u64";
              },
              {
                name: "num_cycles";
                type: {
                  option: "u64";
                };
              },
              {
                name: "reset_every_cycle";
                type: "bool";
              },
            ];
          },
        ];
      };
    },
  ];
  events: [
    {
      name: "OneTimePreAuthorizationClosed";
      fields: [
        {
          name: "data";
          type: {
            defined: "PreAuthorizationClosedEventData";
          };
          index: false;
        },
      ];
    },
    {
      name: "RecurringPreAuthorizationClosed";
      fields: [
        {
          name: "data";
          type: {
            defined: "PreAuthorizationClosedEventData";
          };
          index: false;
        },
      ];
    },
    {
      name: "DebitEvent";
      fields: [
        {
          name: "preAuthorization";
          type: "publicKey";
          index: false;
        },
        {
          name: "debitAuthority";
          type: "publicKey";
          index: false;
        },
        {
          name: "smartDelegate";
          type: "publicKey";
          index: false;
        },
        {
          name: "mint";
          type: "publicKey";
          index: false;
        },
        {
          name: "tokenProgram";
          type: "publicKey";
          index: false;
        },
        {
          name: "sourceTokenAccountOwner";
          type: "publicKey";
          index: false;
        },
        {
          name: "destinationTokenAccountOwner";
          type: "publicKey";
          index: false;
        },
        {
          name: "sourceTokenAccount";
          type: "publicKey";
          index: false;
        },
        {
          name: "destinationTokenAccount";
          type: "publicKey";
          index: false;
        },
        {
          name: "debitVariant";
          type: {
            defined: "DebitEventVariant";
          };
          index: false;
        },
      ];
    },
    {
      name: "OneTimePreAuthorizationCreated";
      fields: [
        {
          name: "data";
          type: {
            defined: "PreAuthorizationCreatedEventData";
          };
          index: false;
        },
      ];
    },
    {
      name: "RecurringPreAuthorizationCreated";
      fields: [
        {
          name: "data";
          type: {
            defined: "PreAuthorizationCreatedEventData";
          };
          index: false;
        },
      ];
    },
    {
      name: "SmartDelegateInitialized";
      fields: [
        {
          name: "payer";
          type: "publicKey";
          index: false;
        },
        {
          name: "smartDelegate";
          type: "publicKey";
          index: false;
        },
      ];
    },
    {
      name: "PreAuthorizationPaused";
      fields: [
        {
          name: "data";
          type: {
            defined: "PausePreAuthorizationEventData";
          };
          index: false;
        },
      ];
    },
    {
      name: "PreAuthorizationUnpaused";
      fields: [
        {
          name: "data";
          type: {
            defined: "PausePreAuthorizationEventData";
          };
          index: false;
        },
      ];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "PreAuthorizationNotActive";
      msg: "Pre-Authorization not active";
    },
    {
      code: 6001;
      name: "CannotDebitMoreThanAvailable";
      msg: "Cannot debit more than authorized";
    },
    {
      code: 6002;
      name: "LastDebitedCycleBeforeCurrentCycle";
      msg: "Last debited cycle is after current debited cycle (invalid state)";
    },
    {
      code: 6003;
      name: "InvalidTimestamp";
      msg: "Invalid timestamp value provided";
    },
    {
      code: 6004;
      name: "PreAuthorizationPaused";
      msg: "Pre-Authorization paused";
    },
    {
      code: 6005;
      name: "OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds";
      msg: "Only token account owner can receive funds from closing pre-authorization account";
    },
    {
      code: 6006;
      name: "PreAuthorizationTokenAccountMismatch";
      msg: "Pre-authorization and token account mismatch";
    },
    {
      code: 6007;
      name: "PreAuthorizationCloseUnauthorized";
      msg: "Pre-authorization can only be closed by debit_authority or token_account.owner";
    },
    {
      code: 6008;
      name: "SmartDelegateCloseUnauthorized";
      msg: "Smart delegate can only be closed by token account owner";
    },
    {
      code: 6009;
      name: "PausePreAuthorizationUnauthorized";
      msg: "Only token account owner can pause a pre-authorization";
    },
    {
      code: 6010;
      name: "DebitUnauthorized";
      msg: "Only pre_authorization.debit_authority is authorized to debit funds using pre-authorizations";
    },
    {
      code: 6011;
      name: "InitPreAuthorizationUnauthorized";
      msg: "Only token account owner can initialize a pre-authorization";
    },
    {
      code: 6012;
      name: "InitSmartDelegateUnauthorized";
      msg: "Only token account owner can initialize a smart delegate";
    },
  ];
};

export const IDL: PreAuthorizedDebitV1 = {
  version: "1.0.0",
  name: "pre_authorized_debit_v1",
  instructions: [
    {
      name: "initSmartDelegate",
      docs: [
        "The `InitSmartDelegate` instruction will create a global `smart_delegate` account.\n\n    Initializes a new account (`smart_delegate`).\n    The `smart_delegate` PDA is used by the `pre_authorized_debit` program to sign for\n    valid pre-authorized debits to transfer funds from the `pre_authorization.token_account`.\n    The `smart_delegate` account can NEVER be closed.\n\n    The `payer` MUST sign the transaction.\n    The `payer` MUST have enough lamports to pay for the `smart_delegate` account.\n\n    Accounts expected by this instruction:\n        0. `[writable]` payer\n        1. `[writable]` smart_delegate\n        2. `[]`         system_program",
      ],
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "smartDelegate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initPreAuthorization",
      docs: [
        "The `InitPreAuthorization` instruction will create a `pre_authorization` account.\n\n    Initializes a new account (`pre_authorization`).\n    The `pre_authorization` defines a set of rules.\n    The `pre_authorization` rules/constraints are verified during a `debit` instruction.\n    The `pre_authorization` in conjunction with a `smart_delegate` for the same `token_account`\n    can allow the `pre_authorization.debit_authority` to do a one-time or recurring debit from the\n    `token_account.\n    For a pair of `debit_authority` and `token_account`, only a single `pre_authorization` account can exist.\n    To create another `pre_authorization` for the same `token_account`, another `debit_authority` must be used.\n\n    The `payer` MUST sign the transaction.\n    The `payer` MUST have enough lamports to pay for the `pre_authorization` account.\n    The `owner` MUST sign the transaction.\n    The `owner` MUST be the `token_account.owner`.\n    The `payer` and `owner` may be the same account.\n    The `token_account.owner` MUST be the `owner`.\n    The `pre_authorization.token_account` must be the same as `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` payer\n        1. `[]`         owner\n        2. `[writable]` token_account\n        3. `[writable]` pre_authorization\n        4. `[]`         system_program",
      ],
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "smartDelegate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "preAuthorization",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "InitPreAuthorizationParams",
          },
        },
      ],
    },
    {
      name: "closePreAuthorization",
      docs: [
        "The `ClosePreAuthorization` instruction will close a `pre_authorization` account.\n\n    Closes an existing `pre_authorization` account and refunds the lamports\n    to the `token_account.owner` (`receiver`).\n\n    The `receiver` will receive all lamports from the closed account.\n    The `receiver` MUST be the `token_account.owner`.\n    The `authority` MUST sign for the instruction.\n    The `authority` MUST be either the `token_account.owner` or the `pre_authorization.debit_authority`.\n    The `owner` MUST be the `token_account.owner`.\n    The `token_account.owner` MUST be the `owner`.\n    The `pre_authorization.token_account` must be the same as `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` receiver\n        1. `[]`         authority\n        2. `[]`         token_account\n        3. `[writable]` pre_authorization",
      ],
      accounts: [
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "preAuthorization",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "debit",
      docs: [
        "The `Debit` instruction allows a `pre_authorization.debit_authority` to debit from the\n    `pre_authorization.token_account` via the `smart_delegate` PDA. To successfully debit from\n    the `token_account`, the constraints for the `pre_authorization` must be met.\n\n    Definitions:\n      - PA = pre_authorization\n\n    Common Rules:\n    - The `pre_authorization` MUST not be paused.\n    - The amount being requested to debit must be less than or equal to the available amount for the current_cycle\n    - The current timestamp must be less than the `PA.expiry_unix_timestamp`\n    - If the PA has a `num_cycles` defined, the `current_cycle` must be less than or equal to `PA.num_cycles`\n\n    For a recurring pre-authorization:\n    - The debit_authority must not have already done a debit in the current cycle\n\n    For a one-time pre-authorization:\n    - the validator time must be greater than or equal to the `pre_authorization.activation_unix_timestamp`\n\n    For a more in-depth understanding around the constraints in a debit, it is recommended to read through\n    the validation done for a `debit` instruction.\n\n    The `debit_authority` MUST sign the transaction.\n    The `debit_authority` MUST equal the `pre_authorization.debit_authority`.\n    The `mint` MUST equal `token_account.mint` and `destination_token_account.mint`.\n    The `token_account.delegate` MUST equal the `smart_delegate`.\n    The `token_account.mint` MUST equal the `mint`.\n    The `destination_token_account.mint` MUST equal `mint`.\n    The `pre_authorization.token_account` MUST equal the `token_account`.\n    The `token_program` MUST equal the token program matching the `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[]`         debit_authority\n        1. `[]`         mint\n        2. `[writable]` token_account\n        3. `[writable]` destination_token_account\n        4. `[]`         smart_delegate\n        5. `[writable]` pre_authorization\n        6. `[]`         token_program",
      ],
      accounts: [
        {
          name: "debitAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "smartDelegate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "preAuthorization",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "DebitParams",
          },
        },
      ],
    },
    {
      name: "updatePausePreAuthorization",
      docs: [
        "The `UpdatePausePreAuthorization` instruction allows a `token_account.owner` to pause a\n    `pre_authorization`.\n\n    The `owner` MUST sign the transaction.\n    The `owner` MUST equal the `token_account.owner`.\n    The `token_account.owner` MUST equal the `owner`.\n    The `pre_authorization.token_account` MUST equal the `token_account`.\n\n    Accounts expected by this instruction:\n        0. `[writable]` owner\n        2. `[]`         token_account\n        3. `[writable]` pre_authorization",
      ],
      accounts: [
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "preAuthorization",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "UpdatePausePreAuthorizationParams",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "preAuthorization",
      docs: [
        "The `pre_authorization` is a PDA account derived with the seeds:\n ['pre-authorization', token_account, debit_authority].\n The `pre_authorization` can be thought of as the rule for the `smart_delegate`.\n The `pre_authorization` can be used to validate a recurring or one-time debit from the `token_account`.\n The `smart_delegate` will validate the rules of the `pre_authorization` in the `debit` instruction.\n A `pre_authorization` is associated many:1 with a `token_account`,\n however, for a given `debit_authority` and `token_account` there can only be one `pre_authorization`.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            docs: [
              "The `bump` is the canonical PDA bump when derived with seeds:\n      ['pre-authorization', token_account, debit_authority].\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ],
            type: "u8",
          },
          {
            name: "paused",
            docs: [
              "If `paused === true`, then the `debit_authority` cannot debit via the `token_account`.\n      This field is initialized to `false` in `init_pre_authorization`.\n      This field can be updated by the `token_account.owner` in `update_pause_pre_authorization`.\n      Note that recurring rebits that accrue the amounts across cycles will continue to do so while paused\n        (close the pre-authorization to stop this).",
            ],
            type: "bool",
          },
          {
            name: "tokenAccount",
            docs: [
              "The `token_account` is the account the `debit_authority` will be able to debit from.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ],
            type: "publicKey",
          },
          {
            name: "variant",
            docs: [
              "The `variant` contains the data specific to a one-time\n      or recurring debit.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ],
            type: {
              defined: "PreAuthorizationVariant",
            },
          },
          {
            name: "debitAuthority",
            docs: [
              "The `debit_authority` is the signer that can debit from the `token_account`.\n      This field is initialized in `init_pre_authorization`.\n      This field is never updated in any instruction.",
            ],
            type: "publicKey",
          },
          {
            name: "activationUnixTimestamp",
            docs: [
              "The `activation_unix_timestamp` represents when the pre-authorization becomes active (i.e. debits can occur).\n      The field is initialized in `init_pre_authorization`.",
            ],
            type: "i64",
          },
        ],
      },
    },
    {
      name: "smartDelegate",
      docs: [
        "The `smart_delegate` is a PDA account derived with the seeds:\n  ['smart-delegate'].\n  The `smart_delegate` should be set as the delegate of any\n  `token_account` specified in a `pre_authorization`.\n  The `smart_delegate` is a global account and is only initialized once.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            docs: [
              "The `bump` is the canonical PDA bump when derived with seeds:\n      ['smart-delegate'].\n      This field is initialized in `init_smart_delegate`.\n      This field is never updated in any instruction.",
            ],
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "PreAuthorizationClosedEventData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "debitAuthority",
            type: "publicKey",
          },
          {
            name: "closingAuthority",
            type: "publicKey",
          },
          {
            name: "tokenAccountOwner",
            type: "publicKey",
          },
          {
            name: "receiver",
            type: "publicKey",
          },
          {
            name: "tokenAccount",
            type: "publicKey",
          },
          {
            name: "preAuthorization",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "DebitParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "InitPreAuthorizationParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "variant",
            type: {
              defined: "InitPreAuthorizationVariant",
            },
          },
          {
            name: "debitAuthority",
            type: "publicKey",
          },
          {
            name: "activationUnixTimestamp",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "PreAuthorizationCreatedEventData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "debitAuthority",
            type: "publicKey",
          },
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "payer",
            type: "publicKey",
          },
          {
            name: "tokenAccount",
            type: "publicKey",
          },
          {
            name: "preAuthorization",
            type: "publicKey",
          },
          {
            name: "initParams",
            type: {
              defined: "InitPreAuthorizationParams",
            },
          },
        ],
      },
    },
    {
      name: "UpdatePausePreAuthorizationParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "pause",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "PausePreAuthorizationEventData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "tokenAccount",
            type: "publicKey",
          },
          {
            name: "preAuthorization",
            type: "publicKey",
          },
          {
            name: "newPausedValue",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "DebitEventVariant",
      type: {
        kind: "enum",
        variants: [
          {
            name: "OneTime",
            fields: [
              {
                name: "debit_amount",
                type: "u64",
              },
            ],
          },
          {
            name: "Recurring",
            fields: [
              {
                name: "debit_amount",
                type: "u64",
              },
              {
                name: "cycle",
                type: "u64",
              },
            ],
          },
        ],
      },
    },
    {
      name: "InitPreAuthorizationVariant",
      type: {
        kind: "enum",
        variants: [
          {
            name: "OneTime",
            fields: [
              {
                name: "amount_authorized",
                type: "u64",
              },
              {
                name: "expiry_unix_timestamp",
                type: "i64",
              },
            ],
          },
          {
            name: "Recurring",
            fields: [
              {
                name: "repeat_frequency_seconds",
                type: "u64",
              },
              {
                name: "recurring_amount_authorized",
                type: "u64",
              },
              {
                name: "num_cycles",
                type: {
                  option: "u64",
                },
              },
              {
                name: "reset_every_cycle",
                type: "bool",
              },
            ],
          },
        ],
      },
    },
    {
      name: "PreAuthorizationVariant",
      type: {
        kind: "enum",
        variants: [
          {
            name: "OneTime",
            fields: [
              {
                name: "amount_authorized",
                type: "u64",
              },
              {
                name: "expiry_unix_timestamp",
                type: "i64",
              },
              {
                name: "amount_debited",
                type: "u64",
              },
            ],
          },
          {
            name: "Recurring",
            fields: [
              {
                name: "repeat_frequency_seconds",
                type: "u64",
              },
              {
                name: "recurring_amount_authorized",
                type: "u64",
              },
              {
                name: "amount_debited_last_cycle",
                type: "u64",
              },
              {
                name: "amount_debited_total",
                type: "u64",
              },
              {
                name: "last_debited_cycle",
                type: "u64",
              },
              {
                name: "num_cycles",
                type: {
                  option: "u64",
                },
              },
              {
                name: "reset_every_cycle",
                type: "bool",
              },
            ],
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "OneTimePreAuthorizationClosed",
      fields: [
        {
          name: "data",
          type: {
            defined: "PreAuthorizationClosedEventData",
          },
          index: false,
        },
      ],
    },
    {
      name: "RecurringPreAuthorizationClosed",
      fields: [
        {
          name: "data",
          type: {
            defined: "PreAuthorizationClosedEventData",
          },
          index: false,
        },
      ],
    },
    {
      name: "DebitEvent",
      fields: [
        {
          name: "preAuthorization",
          type: "publicKey",
          index: false,
        },
        {
          name: "debitAuthority",
          type: "publicKey",
          index: false,
        },
        {
          name: "smartDelegate",
          type: "publicKey",
          index: false,
        },
        {
          name: "mint",
          type: "publicKey",
          index: false,
        },
        {
          name: "tokenProgram",
          type: "publicKey",
          index: false,
        },
        {
          name: "sourceTokenAccountOwner",
          type: "publicKey",
          index: false,
        },
        {
          name: "destinationTokenAccountOwner",
          type: "publicKey",
          index: false,
        },
        {
          name: "sourceTokenAccount",
          type: "publicKey",
          index: false,
        },
        {
          name: "destinationTokenAccount",
          type: "publicKey",
          index: false,
        },
        {
          name: "debitVariant",
          type: {
            defined: "DebitEventVariant",
          },
          index: false,
        },
      ],
    },
    {
      name: "OneTimePreAuthorizationCreated",
      fields: [
        {
          name: "data",
          type: {
            defined: "PreAuthorizationCreatedEventData",
          },
          index: false,
        },
      ],
    },
    {
      name: "RecurringPreAuthorizationCreated",
      fields: [
        {
          name: "data",
          type: {
            defined: "PreAuthorizationCreatedEventData",
          },
          index: false,
        },
      ],
    },
    {
      name: "SmartDelegateInitialized",
      fields: [
        {
          name: "payer",
          type: "publicKey",
          index: false,
        },
        {
          name: "smartDelegate",
          type: "publicKey",
          index: false,
        },
      ],
    },
    {
      name: "PreAuthorizationPaused",
      fields: [
        {
          name: "data",
          type: {
            defined: "PausePreAuthorizationEventData",
          },
          index: false,
        },
      ],
    },
    {
      name: "PreAuthorizationUnpaused",
      fields: [
        {
          name: "data",
          type: {
            defined: "PausePreAuthorizationEventData",
          },
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "PreAuthorizationNotActive",
      msg: "Pre-Authorization not active",
    },
    {
      code: 6001,
      name: "CannotDebitMoreThanAvailable",
      msg: "Cannot debit more than authorized",
    },
    {
      code: 6002,
      name: "LastDebitedCycleBeforeCurrentCycle",
      msg: "Last debited cycle is after current debited cycle (invalid state)",
    },
    {
      code: 6003,
      name: "InvalidTimestamp",
      msg: "Invalid timestamp value provided",
    },
    {
      code: 6004,
      name: "PreAuthorizationPaused",
      msg: "Pre-Authorization paused",
    },
    {
      code: 6005,
      name: "OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds",
      msg: "Only token account owner can receive funds from closing pre-authorization account",
    },
    {
      code: 6006,
      name: "PreAuthorizationTokenAccountMismatch",
      msg: "Pre-authorization and token account mismatch",
    },
    {
      code: 6007,
      name: "PreAuthorizationCloseUnauthorized",
      msg: "Pre-authorization can only be closed by debit_authority or token_account.owner",
    },
    {
      code: 6008,
      name: "SmartDelegateCloseUnauthorized",
      msg: "Smart delegate can only be closed by token account owner",
    },
    {
      code: 6009,
      name: "PausePreAuthorizationUnauthorized",
      msg: "Only token account owner can pause a pre-authorization",
    },
    {
      code: 6010,
      name: "DebitUnauthorized",
      msg: "Only pre_authorization.debit_authority is authorized to debit funds using pre-authorizations",
    },
    {
      code: 6011,
      name: "InitPreAuthorizationUnauthorized",
      msg: "Only token account owner can initialize a pre-authorization",
    },
    {
      code: 6012,
      name: "InitSmartDelegateUnauthorized",
      msg: "Only token account owner can initialize a smart delegate",
    },
  ],
};
