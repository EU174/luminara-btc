# Security policy

## Current status

This repository is a pre-alpha public project shell and does not yet contain an executable service.

## Reporting a vulnerability

Do not publish a suspected vulnerability, exploit, credential, wallet identifier, user record, or
production detail in a public issue.

Private vulnerability reporting and a maintained disclosure channel will be enabled before the
first executable code release. Until that gate is complete, no production system is represented by
this repository.

## Security boundaries

- No seed phrase, private key, token, database URL, raw personal identifier, wallet proof, or
  production configuration belongs in Git history.
- Public source must contain no main-Luminara user, subscription, payment, or administrator data.
- Authentication, authorization, and data isolation require server-side negative tests.
- A public repository is not a substitute for independent security review.
