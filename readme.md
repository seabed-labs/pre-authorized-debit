# seabed-program-library

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
anchor test
# To make use of a ".only" in a test
# TEST_MODE=debug anchor test
```


