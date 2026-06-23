# Security Policy

## Supported Versions

Only the latest production release on the `main` branch is actively supported with security updates.

| Version | Supported |
| ------- | --------- |
| 1.x.x   | Yes       |
| < 1.0.0 | No        |

## Reporting a Vulnerability

We take the security and integrity of our systems seriously. If you find a security vulnerability, please do not disclose it publicly or open an issue on the public repository. Instead, report it privately by following these steps:

1. Send an email to the SFI West Bengal State Committee team at **state.committee.sfi.wb@gmail.com**.
2. Include a detailed description of the vulnerability, including:
   - Steps to reproduce
   - Potential impact
   - A proof of concept (if applicable)
   - Your contact information

We will review your submission and respond within **48–72 hours** with an initial evaluation and a plan for remediation.

## Notice on Source Code Obfuscation

This project employs a client-side XOR-based obfuscation pipeline (`obfuscator.py`) to protect asset structures, local stylesheets, and client scripts. 

> [!WARNING]
> This obfuscation layer is designed to discourage content scraping and basic source copying. It does **not** provide cryptographic security for sensitive data. 
> - **Do not** store API keys, private credentials, or personal user data in any client-side JavaScript or HTML templates, even if they are run through the obfuscator.
> - Client-side decryption happens at load time in the browser via JavaScript, meaning any knowledgeable user can retrieve the raw decrypted source code.
