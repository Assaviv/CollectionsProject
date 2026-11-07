# Contributing to Save App

First of all, thank you for considering contributing to **Save App**! Every contribution is appreciated, whether it's a bug fix, a new feature, an improvement to the documentation, or simply sharing an idea.

This document explains how to get involved and contribute effectively.

## Getting Started

Before contributing, make sure you have:

- [Git](https://git-scm.com/) installed.
- [Node.js](https://nodejs.org/) installed.
- [npm](https://www.npmjs.com/) installed.
- Access to the project's source code.

### Setting Up the Project

1. Fork the repository.

2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   cd YOUR_REPOSITORY
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development environment using the project's configured development script.

   ```bash
   nx serve
   ```

   Check `package.json` for the available scripts and any additional setup requirements.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue and include:

- A clear and descriptive title.
- Steps to reproduce the problem.
- Expected behavior.
- Actual behavior.
- Relevant screenshots, logs, or error messages.
- Your environment (browser, operating system, and app version).

Before opening a new issue, check whether someone has already reported the same problem.

### Suggesting Features

Have an idea that could make Save App better?

Open a feature request describing:

- The problem you're trying to solve.
- Your proposed solution.
- Why this feature would be useful.
- Any alternative approaches you've considered.

Save App is intended to be a flexible place to capture and retrieve personal information. Contributions that improve the capture, organization, discovery, and retrieval of information are especially welcome.

### Submitting Code Changes

1. Create a new branch from the main development branch.

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes.

3. Test your changes locally.

4. Commit your work with a descriptive commit message.

   ```bash
   git commit -m "feat: add card filtering"
   ```

5. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request against the original repository.

## Development Guidelines

Please keep the following principles in mind when contributing:

- **Keep changes focused:** Prefer small, self-contained pull requests.
- **Follow existing conventions:** Maintain consistency with the existing architecture and coding style.
- **Think about usability:** Save App should remain intuitive and easy to use.
- **Consider mobile users:** Changes should work well on both desktop and mobile environments.
- **Avoid unnecessary complexity:** Prefer simple, maintainable solutions.
- **Document important changes:** Update documentation when introducing new behavior or configuration.

## Commit Messages

Use clear, descriptive commit messages. Conventional Commits are encouraged:

| Prefix      | Purpose                                     |
| ----------- | ------------------------------------------- |
| `feat:`     | Introduce a new feature                     |
| `fix:`      | Fix a bug                                   |
| `docs:`     | Documentation changes                       |
| `refactor:` | Code restructuring without behavior changes |
| `test:`     | Add or update tests                         |
| `style:`    | Formatting and styling changes              |
| `chore:`    | Maintenance tasks                           |

Examples:

```text
feat: add card search functionality
fix: resolve collection loading issue
docs: update installation instructions
refactor: simplify card input handling
```

## Pull Request Guidelines

Before submitting a Pull Request:

- [ ] Make sure your branch is up to date.
- [ ] Ensure the application builds successfully.
- [ ] Run relevant tests.
- [ ] Check that your changes work on mobile and desktop when applicable.
- [ ] Update documentation if necessary.
- [ ] Keep the PR description clear and explain the motivation behind your changes.

Each Pull Request should ideally address one specific problem or introduce one focused improvement.

Maintainers may request changes or clarification before merging.

## Code of Conduct

Be respectful, constructive, and welcoming.

- Treat everyone with respect.
- Welcome different perspectives and approaches.
- Provide constructive feedback.
- Focus discussions on ideas and implementations, not individuals.

## Questions?

If you have questions or need clarification, feel free to open a discussion or issue in the repository.

Thank you for helping make Save App better!

**Happy contributing!** 🚀
