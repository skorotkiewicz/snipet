use clap::{Parser, Subcommand};
use colored::*;
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Read};
use std::path::PathBuf;

/// Snipet CLI - Post code snippets from your terminal
#[derive(Parser, Debug)]
#[command(name = "snipet")]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Title for the snippet (required when posting)
    #[arg(short, long)]
    title: Option<String>,

    /// Description for the snippet (optional)
    #[arg(short, long)]
    desc: Option<String>,

    /// Programming language (auto-detected from extension or defaults to "text")
    #[arg(short, long)]
    lang: Option<String>,

    /// Visibility: public or private (default: public)
    #[arg(short, long, default_value = "public")]
    visibility: String,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Login and save credentials
    Login {
        /// Email address
        #[arg(short, long)]
        email: String,

        /// Password
        #[arg(short, long)]
        password: String,

        /// PocketBase server URL
        #[arg(short, long, default_value = "http://127.0.0.1:8090")]
        server: String,
    },
    /// Register a new user account
    Register {
        /// Email address
        #[arg(short, long)]
        email: String,

        /// Password (min 8 characters)
        #[arg(short, long)]
        password: String,

        /// Display name
        #[arg(short, long)]
        name: String,

        /// PocketBase server URL
        #[arg(short, long, default_value = "http://127.0.0.1:8090")]
        server: String,
    },
    /// Show current configuration
    Config,
    /// Logout and remove saved credentials
    Logout,
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    email: String,
    token: String,
    user_id: String,
    server: String,
}

#[derive(Debug, Deserialize)]
struct AuthResponse {
    token: String,
    record: UserRecord,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct UserRecord {
    id: String,
    email: Option<String>,
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RegisterRequest {
    email: String,
    password: String,
    password_confirm: String,
    name: String,
}

#[derive(Debug, Serialize)]
struct CreateSnippetRequest {
    title: String,
    code: String,
    language: String,
    description: String,
    visibility: String,
    author: String,
}

#[derive(Debug, Deserialize)]
struct SnippetResponse {
    id: String,
    title: String,
}

#[derive(Debug, Deserialize)]
struct ErrorResponse {
    message: Option<String>,
    data: Option<serde_json::Value>,
}

fn get_config_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("snipet");
    fs::create_dir_all(&path).ok();
    path.push("config.toml");
    path
}

fn load_config() -> Option<Config> {
    let path = get_config_path();
    let content = fs::read_to_string(path).ok()?;
    toml::from_str(&content).ok()
}

fn save_config(config: &Config) -> io::Result<()> {
    let path = get_config_path();
    let content = toml::to_string_pretty(config).unwrap();
    fs::write(path, content)
}

fn delete_config() -> io::Result<()> {
    let path = get_config_path();
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

fn format_error(resp: ErrorResponse) -> String {
    let mut msg = resp.message.unwrap_or_else(|| "Unknown error".to_string());
    
    if let Some(data) = resp.data {
        if let Some(obj) = data.as_object() {
            let details: Vec<String> = obj.iter()
                .filter_map(|(key, val)| {
                    val.get("message").and_then(|m| m.as_str()).map(|m| format!("{}: {}", key, m))
                })
                .collect();
            if !details.is_empty() {
                msg = format!("{} ({})", msg, details.join(", "));
            }
        }
    }
    msg
}

fn register(email: &str, password: &str, name: &str, server: &str) -> Result<UserRecord, String> {
    let client = Client::new();
    let url = format!("{}/api/collections/users/records", server);

    let request = RegisterRequest {
        email: email.to_string(),
        password: password.to_string(),
        password_confirm: password.to_string(),
        name: name.to_string(),
    };

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .map_err(|e| format!("Failed to connect to server: {}", e))?;

    if response.status().is_success() {
        let user: UserRecord = response
            .json()
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        Ok(user)
    } else {
        let error: ErrorResponse = response.json().unwrap_or(ErrorResponse { message: None, data: None });
        Err(format_error(error))
    }
}

fn login(email: &str, password: &str, server: &str) -> Result<Config, String> {
    let client = Client::new();
    let url = format!("{}/api/collections/users/auth-with-password", server);

    let response = client
        .post(&url)
        .json(&serde_json::json!({
            "identity": email,
            "password": password
        }))
        .send()
        .map_err(|e| format!("Failed to connect to server: {}", e))?;

    if response.status().is_success() {
        let auth: AuthResponse = response
            .json()
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(Config {
            email: auth.record.email.unwrap_or_else(|| email.to_string()),
            token: auth.token,
            user_id: auth.record.id,
            server: server.to_string(),
        })
    } else {
        let error: ErrorResponse = response.json().unwrap_or(ErrorResponse { message: None, data: None });
        Err(format_error(error))
    }
}

fn detect_language(code: &str) -> &str {
    // Simple heuristic detection based on content patterns
    let code_lower = code.to_lowercase();

    if code_lower.contains("def ") && code_lower.contains(":") && !code_lower.contains("{") {
        "python"
    } else if code_lower.contains("fn ") && code_lower.contains("->") {
        "rust"
    } else if code_lower.contains("func ") && code_lower.contains("package ") {
        "go"
    } else if code_lower.contains("public class ") || code_lower.contains("private class ") {
        "java"
    } else if code_lower.contains("namespace ") && code_lower.contains("using ") {
        "csharp"
    } else if code_lower.contains("#include") {
        "cpp"
    } else if code_lower.contains("<html") || code_lower.contains("<!doctype") {
        "html"
    } else if code_lower.contains("select ") && code_lower.contains("from ") {
        "sql"
    } else if code.trim().starts_with('{') || code.trim().starts_with('[') {
        "json"
    } else if code_lower.contains("function ") || code_lower.contains("const ") || code_lower.contains("let ") {
        if code_lower.contains(": string") || code_lower.contains(": number") || code_lower.contains("<") {
            "typescript"
        } else {
            "javascript"
        }
    } else if code_lower.contains("@media") || (code_lower.contains("{") && code_lower.contains(":") && code_lower.contains(";")) {
        "css"
    } else {
        "javascript" // Default fallback
    }
}

fn post_snippet(config: &Config, title: &str, code: &str, description: &str, language: &str, visibility: &str) -> Result<SnippetResponse, String> {
    let client = Client::new();
    let url = format!("{}/api/collections/snippets/records", config.server);

    let request = CreateSnippetRequest {
        title: title.to_string(),
        code: code.to_string(),
        language: language.to_string(),
        description: description.to_string(),
        visibility: visibility.to_string(),
        author: config.user_id.clone(),
    };

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .json(&request)
        .send()
        .map_err(|e| format!("Failed to connect to server: {}", e))?;

    if response.status().is_success() {
        let snippet: SnippetResponse = response
            .json()
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        Ok(snippet)
    } else {
        let status = response.status();
        let error: ErrorResponse = response.json().unwrap_or(ErrorResponse { message: None, data: None });
        Err(format!(
            "Failed to create snippet ({}): {}",
            status,
            format_error(error)
        ))
    }
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Register { email, password, name, server }) => {
            print!("{}", "📝 Registering new user... ".cyan());
            match register(&email, &password, &name, &server) {
                Ok(_user) => {
                    println!("{}", "Success!".green().bold());
                    println!("  {} Created user: {}", "✓".green(), email.cyan());
                    println!();
                    println!("  Now login with:");
                    println!("  {} {} {}", 
                        "snipet".cyan(), 
                        "login".green(), 
                        format!("--email {} --password <password>", email).dimmed()
                    );
                }
                Err(e) => {
                    println!("{}", "Failed!".red().bold());
                    eprintln!("  {} {}", "✗".red(), e);
                    std::process::exit(1);
                }
            }
        }
        Some(Commands::Login { email, password, server }) => {
            print!("{}", "🔐 Logging in... ".cyan());
            match login(&email, &password, &server) {
                Ok(config) => {
                    save_config(&config).expect("Failed to save config");
                    println!("{}", "Success!".green().bold());
                    println!("  {} Logged in as: {}", "✓".green(), config.email.cyan());
                    println!("  {} Server: {}", "✓".green(), config.server);
                    println!("  {} Config saved to: {:?}", "✓".green(), get_config_path());
                }
                Err(e) => {
                    println!("{}", "Failed!".red().bold());
                    eprintln!("  {} {}", "✗".red(), e);
                    eprintln!();
                    eprintln!("  {} Make sure you're using a {} account, not the admin account.", "💡".yellow(), "user".cyan());
                    eprintln!("  {} To create a new user: {} {} {}", "💡".yellow(), "snipet".cyan(), "register".green(), "--email EMAIL --password PASSWORD --name NAME".dimmed());
                    std::process::exit(1);
                }
            }
        }
        Some(Commands::Config) => {
            match load_config() {
                Some(config) => {
                    println!("{}", "📋 Current Configuration:".cyan().bold());
                    println!("  {} Email: {}", "→".blue(), config.email);
                    println!("  {} Server: {}", "→".blue(), config.server);
                    println!("  {} User ID: {}", "→".blue(), config.user_id);
                    println!("  {} Token: {}...", "→".blue(), &config.token[..20.min(config.token.len())]);
                }
                None => {
                    eprintln!("{} Not logged in. Run: {} {}", "✗".red(), "snipet login".cyan(), "--email <EMAIL> --password <PASSWORD>".dimmed());
                    std::process::exit(1);
                }
            }
        }
        Some(Commands::Logout) => {
            match delete_config() {
                Ok(_) => {
                    println!("{} {}", "✓".green(), "Logged out successfully".green());
                }
                Err(e) => {
                    eprintln!("{} Failed to logout: {}", "✗".red(), e);
                    std::process::exit(1);
                }
            }
        }
        None => {
            // Post mode - read from stdin
            let title = match cli.title {
                Some(t) => t,
                None => {
                    eprintln!("{} Title is required. Use: {} <file> | {} {}", "✗".red(), "cat".dimmed(), "snipet".cyan(), "--title \"Your Title\"".dimmed());
                    eprintln!("  Or run {} for help", "snipet --help".cyan());
                    std::process::exit(1);
                }
            };

            // Check if stdin is a TTY (no piped input)
            if atty::is(atty::Stream::Stdin) {
                eprintln!("{} No input provided. Pipe content to snipet:", "✗".red());
                eprintln!("  {} | {} {}", "cat file.rs".dimmed(), "snipet".cyan(), "--title \"My Snippet\"".dimmed());
                eprintln!("  {} | {} {}", "echo 'console.log(1)'".dimmed(), "snipet".cyan(), "--title \"Quick Test\"".dimmed());
                std::process::exit(1);
            }

            // Load config
            let config = match load_config() {
                Some(c) => c,
                None => {
                    eprintln!("{} Not logged in. First run:", "✗".red());
                    eprintln!("  {} {} {}", "snipet".cyan(), "login".green(), "--email <EMAIL> --password <PASSWORD>".dimmed());
                    std::process::exit(1);
                }
            };

            // Read stdin
            let mut code = String::new();
            io::stdin().read_to_string(&mut code).expect("Failed to read stdin");

            if code.trim().is_empty() {
                eprintln!("{} No code provided (empty input)", "✗".red());
                std::process::exit(1);
            }

            // Determine language
            let language = cli.lang.unwrap_or_else(|| detect_language(&code).to_string());
            let description = cli.desc.unwrap_or_default();
            let visibility = cli.visibility;

            // Validate visibility
            if visibility != "public" && visibility != "private" {
                eprintln!("{} Visibility must be 'public' or 'private'", "✗".red());
                std::process::exit(1);
            }

            print!("{}", "📤 Posting snippet... ".cyan());

            match post_snippet(&config, &title, &code, &description, &language, &visibility) {
                Ok(snippet) => {
                    println!("{}", "Success!".green().bold());
                    println!();
                    println!("  {} Title: {}", "✓".green(), snippet.title.cyan());
                    println!("  {} Language: {}", "✓".green(), language);
                    println!("  {} Visibility: {}", "✓".green(), visibility);
                    println!("  {} ID: {}", "✓".green(), snippet.id);
                    
                    // Print URL (assuming web app runs on same host or localhost:5173 for dev)
                    let base_url = if config.server.contains("127.0.0.1") || config.server.contains("localhost") {
                        "http://localhost:5173"
                    } else {
                        &config.server
                    };
                    println!();
                    println!("  {} {}/snippet/{}", "🔗".cyan(), base_url, snippet.id);
                }
                Err(e) => {
                    println!("{}", "Failed!".red().bold());
                    eprintln!("  {} {}", "✗".red(), e);
                    std::process::exit(1);
                }
            }
        }
    }
}
