# Security Policy

MELLI Public Integration Starter is a public-safe integration example. It is not the production MELLI system.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

Report suspected vulnerabilities through GitHub Private Vulnerability Reporting when it is enabled for this repository.

If private vulnerability reporting is not available, contact the maintainers privately through the security contact listed on the MELLI website.

Include:

- A short description of the issue
- Reproduction steps or a minimal proof of concept
- Affected files, functions, or versions
- Any security impact you believe is possible

We will review valid reports and respond as soon as practical.

## Public Repository Boundary

This repository must not contain:

- API keys, access tokens, bearer tokens, private keys, or `.env` files
- Customer records, chat logs, business data, or private customer configuration
- Production webhook URLs, deployment secrets, database credentials, or billing code
- Private prompts, customer-specific routing logic, or production agent orchestration
- Internal dashboards, auth logic, analytics pipelines, or operational runbooks

If any sensitive material is committed by mistake, rotate the credential or revoke the exposed access immediately. Removing it from Git history is not enough.

## Supported Security Scope

Security reports are in scope when they affect this public starter package, including:

- Unsafe default network behavior
- Secret leakage in examples or tests
- Insecure Telegram adapter behavior in the reusable example code
- Provider configuration that could encourage SSRF or credential exposure
- Tool execution examples that bypass validation or ownership checks

Out of scope for this public repository:

- The private production MELLI application
- Customer-specific deployments
- Third-party model providers, Telegram, Ollama, or other external services
- Social engineering, spam, denial-of-service, or automated scanning without permission

## Safe Usage Notes

- Keep bot tokens, provider API keys, and customer configuration outside the repository.
- Verify Telegram webhook secrets in production.
- Rate limit inbound requests before calling model providers.
- Validate tool inputs and check customer ownership before executing tools.
- Keep Ollama base URLs local or private unless you control the remote deployment.
- Log security-relevant actions in your production application, not in this public starter.
