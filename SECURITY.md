# Security Policy

## Supported Versions

Security updates are provided for the latest version of Save App.

| Version | Supported |
|---|---|
| Latest release | :white_check_mark: |
| Older releases | :x: |

Users are encouraged to keep their installations up to date to benefit from the latest security improvements.

## Reporting a Vulnerability

If you discover a security vulnerability in Save App, please report it responsibly.

**Please do not disclose security vulnerabilities through public GitHub issues or discussions.**

Instead, use [GitHub's private vulnerability reporting](https://github.com/Assaviv/CollectionsProject/security/advisories/new) if enabled for this repository.

Your report should include:

- A description of the vulnerability.
- Steps to reproduce the issue.
- The potential security impact.
- Any relevant screenshots, logs, or proof of concept.
- Suggested remediation, if available.

Please avoid including real user data, credentials, access tokens, or other sensitive information in your report.

## What to Expect

After submitting a vulnerability report:

1. The maintainers will review the report and assess its severity.
2. You will receive an acknowledgment as soon as reasonably possible.
3. The maintainers may request additional information to understand the issue.
4. Once confirmed, the vulnerability will be investigated and a fix will be prepared.
5. A security advisory may be published after a fix is available.

Please allow maintainers reasonable time to investigate and address reported vulnerabilities before making them public.

## Security Scope

The following areas are particularly important to Save App:

- **Authentication and authorization:** Unauthorized access to user accounts, collections, or cards.
- **Data privacy:** Exposure of personal information, memories, images, or other user-generated content.
- **Access control:** Improper isolation between users and their private data.
- **API security:** Unauthorized access, privilege escalation, and insecure endpoints.
- **File handling:** Unauthorized access to uploaded files or malicious file uploads.
- **AI and semantic search:** Unintended exposure of private user data through embeddings, retrieval, or chatbot interactions.
- **Session management:** Authentication bypasses, session hijacking, and insecure token handling.

## Responsible Disclosure

We appreciate security researchers and community members who help keep Save App secure.

Please:

- Give maintainers reasonable time to investigate and fix reported vulnerabilities.
- Avoid accessing, modifying, or deleting other users' data.
- Do not disrupt the availability of the service.
- Do not publicly disclose vulnerabilities before coordinating with maintainers.

We are committed to treating security reports seriously and appreciate responsible contributions to making Save App safer.

## Security Best Practices for Contributors

Contributors should:

- Never commit secrets, API keys, passwords, or access tokens.
- Avoid logging sensitive user information.
- Validate and sanitize user input.
- Follow secure authentication and authorization practices.
- Avoid exposing private user data in error messages or API responses.
- Keep dependencies updated and address known vulnerabilities.

Thank you for helping keep Save App and its users safe.
