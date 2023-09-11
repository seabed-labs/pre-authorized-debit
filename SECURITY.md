# Security Policy

1. [Reporting security problems](#reporting-security-problems-in-the-pre-authorized-debit-program)
2. Security Bug Bounties (N/A)
3. [Incident Response Process](#incident-process-response)

## Reporting security problems in the Pre Authorized Debit Program

**DO NOT CREATE A GITHUB ISSUE** to report a security problem.

Instead, please use this [Report a Vulnerability](https://github.com/dcaf-labs/pre-authorized-debit/security/advisories/new) link.
Provide a helpful title, detailed description of the vulnerability and an exploit
proof-of-concept. Speculative submissions without proof-of-concept will be closed
with no further consideration.

If you haven't done so already, please **enable two-factor auth** in your GitHub account.

Expect a response as fast as possible in the advisory, typically within 72 hours.

--

If you do not receive a response in the advisory, email
`security@dcaf.so` with the full URL of the advisory you have created.  DO NOT
include attachments or provide detail sufficient for exploitation regarding the
security issue in this email. **Only provide such details in the advisory**.

## Incident Response Process

In case an incident is discovered or reported, the following process will be
followed to contain, respond and remediate:

### 1. Accept the new report
In response a newly reported security problem, a member of the
`dcaf-labs/teams/admin` group will accept the report to turn it into a draft
advisory.

If the advisory is the result of an audit finding, follow the same process as above but add the auditor's github user(s) and begin the title with "[Audit]".

If the report is out of scope, a member of the `dcaf-labs/teams/admin` group will
comment as such and then close the report.

### 2. Triage
Within the draft security advisory, discuss and determine the severity of the issue. If necessary, members of the `dcaf-labs/teams/admin` group may add other github users to the advisory to assist.
If it is determined that this not a issue then the advisory should be closed and if more follow-up is required a normal public github issue should be created.

### 3. Prepare Fixes
For the `main` branch, prepare a fix for the issue and push them to the corresponding branch in the private repository associated with the draft security advisory.
There is no CI available in the private repository, so you must build from source and manually verify fixes.
Code review from the reporter is ideal, as well as from multiple members of the core development team.

### 4. Ship the patch
Once the fix is accepted, a member of the `dcaf-labs/teams/admin` group should prepare a
- new mainnet release 
- new sdk
- contact all major integrators to migrate users to use the new program

### 5. Public Disclosure and Release
Once the fix has been deployed to mainnet in a new program and a majority of integrators have migrated, the patches from the security advisory may be merged into the main source repository. 
A new official release in github will be created, and all remaining integrators are requested to migrate as quickly as possible.

### 6. Security Advisory Bounty Accounting and Cleanup
At this time, there is no official bug bounty offered by Seabed Labs DMCC.
