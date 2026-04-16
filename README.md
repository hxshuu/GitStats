<p align="center">
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2CoWz5h0wPLgyoflGu1D6ytAUjRKIgDqfLg&s" width="200" alt="GitStats">
</p>

# GitStats

A beautiful terminal dashboard for GitHub repository statistics. View commits, contributors, languages, and activity directly from CLI.


## Features

- Repository info (stars, forks, license, created date)
- Top contributors with commit count and visual bars
- Language distribution with percentages
- ASCII box-drawing terminal UI
- Supports any public GitHub repository

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/gitstats.git
cd gitstats
npm install
```

## Usage

```bash
# Basic usage
node index.js owner/repo

# Example repos
node index.js facebook/react
node index.js microsoft/vscode
node index.js nodejs/node
```

## Options

```bash
node index.js owner/repo -l 10    # limit results (default: 10)
```

## Set GitHub Token (for higher rate limit)

```powershell
# Windows PowerShell
$env:GITHUB_TOKEN = "ghp_your_token_here"
node index.js facebook/react
```

```bash
# Linux/Mac
export GITHUB_TOKEN="ghp_your_token_here"
node index.js facebook/react
```

Get token: GitHub Settings → Developer settings → Personal access tokens

## Sample Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║ facebook/react                                            ★ 244570  🍴 50952 ║
║ License: MIT License  │  Created: 5/24/2013                            ║
╚════════════════════════════════════════════════════════════════════════════╝

▸ CONTRIBUTORS
│ ████████████ sebmarkbage      1939 (100.0%)                          │
│ ███████████░ zpao            1778 (91.7%)                            │
│ ███████████░ gaearon         1682 (86.7%)                           │

▸ LANGUAGES
│ ● JavaScript   68.2% ███████████░░░░░░                              │
│ ● TypeScript  28.9% █████░░░░░░░░░░░                               │
```

## License

This project is licensed under the **MIT License**.

## Requirements

- Node.js 14+
- GitHub account (optional, for higher API rate limit)

---

Made by Himanshu