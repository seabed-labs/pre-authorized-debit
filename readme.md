# Pre Authorized Debit

[![Program Tests](https://github.com/dcaf-labs/pre-authorized-debit/actions/workflows/program-tests.yml/badge.svg)](https://github.com/dcaf-labs/pre-authorized-debit/actions/workflows/program-tests.yml)

The Pre Authorized Debit (PAD) program is a Solana primitive to extend functionality of a token account
with pre-authorized debits (an advanced form of a multi-delegate).
The PAD program supports both spl token program and token program 22.

User funds remain non-custodial in their own token accounts, adding a `smart-delegate` account as their delegate.

Users and protocols agree on and create a `pre-authorization` account to track the pre-authorized debit state.
Pre-authorized debits can be one-time or recurring.

Pre-authorized debt authorities can debit from a users token account using their pre-authorization
and the smart-delegate. Debt authorities can debit from a token account as long as:
- The pre-authorized debit is ready for debiting
- The token account has the necessary funds needed for the debit
- The smart-delegate remains the delegate of the token-account

Users at any time withdraw from their token-account as the `owner` or pause a pre-authorized debit.

## Planned Future Work

To prevent accidental removals of the token-account delegate, an ancillary program is
planned for future development, mimicking a similar feature set as the associated token program.


## Docs

Developer docs and integration guides are viewable at our [gitbook](https://docs.seabed.so/pre-authorized-debit).

## Contributing Guide

🚧🚧🚧 In Progress 🚧🚧🚧

## Developers

All anchor integration tests live under `program-tests`.

All anchor programs live under `programs`.

All SDK's live under `sdk`, and their tests live in their nested sdk folder (`sdk/<name>/tests`).

```bash
├── program-tests
│  └── pre-authorized-debit-v1
├── programs
│  └── pre-authorized-debit-v1
├── scripts
│  ├── package.json
│  ├── README.md
│  └── test.js
├── sdk
│  └── pre-authorized-debit-v1
```
### Requirements

-   rust 1.72.0
-   node 18.17.1
-   yarn 3.6.0
-   solana 1.16.10
-   anchor 0.28.0

### Getting Started

```bash
yarn install
yarn test
```


