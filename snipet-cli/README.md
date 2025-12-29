# Snipet CLI

A command-line tool for posting code snippets to your Snipet server directly from the terminal.

## Installation

### Build from source

```bash
cd snipet-cli
cargo build --release

# Optional: Copy to your PATH
sudo cp target/release/snipet /usr/local/bin/
```

## Usage

### 1. Login first

Before posting snippets, authenticate with your Snipet server:

```bash
snipet login --email your@email.com --password yourpassword

# For a custom server:
snipet login --email your@email.com --password yourpassword --server https://your-pocketbase.com
```

### 2. Post snippets

Pipe any content to `snipet` with a title:

```bash
# Post a file
cat example.rs | snipet --title "My Rust function"

# Post with description
cat helper.py | snipet --title "Python helper" --desc "Utility functions for data processing"

# Post with explicit language
echo "SELECT * FROM users;" | snipet --title "User query" --lang sql

# Post as private
cat secret.js | snipet --title "Private snippet" --visibility private

# Combine options
cat config.json | snipet -t "Config file" -d "Production settings" -l json -v private
```

### 3. Other commands

```bash
# Show current configuration
snipet config

# Logout
snipet logout
```

## Options

| Flag | Long | Description |
|------|------|-------------|
| `-t` | `--title` | Title for the snippet **(required)** |
| `-d` | `--desc` | Description (optional) |
| `-l` | `--lang` | Programming language (auto-detected if not specified) |
| `-v` | `--visibility` | `public` or `private` (default: `public`) |

## Supported Languages

- JavaScript / TypeScript
- Python
- Rust
- Go
- Java
- C# 
- C++
- HTML
- CSS
- JSON
- SQL

The CLI attempts to auto-detect the language based on code patterns if not explicitly specified.

## Configuration

Credentials are stored in `~/.config/snipet/config.toml` (Linux/macOS) or the equivalent on Windows.

## Examples

```bash
# Quick one-liner
echo 'console.log("Hello World!")' | snipet -t "Hello World"

# Post git diff as a snippet
git diff | snipet -t "Recent changes" -l diff

# Post command output
ls -la | snipet -t "Directory listing" -l plain

# Post from clipboard (Linux with xclip)
xclip -selection clipboard -o | snipet -t "From clipboard"

# Post from clipboard (macOS)
pbpaste | snipet -t "From clipboard"
```
