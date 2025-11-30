# Snipet ✂️

> **More than just code.** Snipet is the social media platform for developers to share, discover, and discuss code snippets.

![Snipet Banner](https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop)

## 🚀 About

**Snipet** redefines how we share code. It's not just a pastebin; it's a vibrant community where code meets conversation. Whether you're showcasing a clever algorithm, asking for feedback on a function, or just saving a useful utility for later, Snipet gives your code a home.

## ✨ Features

*   **🎨 Syntax Highlighting:** Beautiful code rendering for over 10+ languages including TypeScript, Python, Rust, and Go.
*   **💬 Social Interaction:** Upvote the best snippets, leave comments, and reply to threads.
*   **👤 User Profiles:** Customize your profile with an avatar and bio. Showcase your best work.
*   **🔄 Version Control:** Keep track of snippet iterations with built-in versioning.
*   **🔒 Secure Auth:** Powered by PocketBase for secure login and registration.
*   **📱 Responsive Design:** Built with Tailwind CSS for a seamless experience on any device.

## 🛠️ Tech Stack

Built with modern, high-performance technologies:

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-B8DBE4?style=for-the-badge&logo=pocketbase&logoColor=black)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)

## 🏁 Getting Started

Follow these steps to get Snipet running locally on your machine.

### Prerequisites

*   Node.js (v18+)
*   Bun (optional, but recommended)
*   PocketBase

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/skorotkiewicz/snipet.git
    cd snipet
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Setup PocketBase**
    *   Download and run PocketBase.
    *   Follow the schema guide in [`pocketbase_schema.md`](./pocketbase_schema.md) to set up your collections (Users, Snippets, Comments, Upvotes).

4.  **Run the development server**
    ```bash
    npm run dev
    # or
    bun run dev
    ```

5.  Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/skorotkiewicz">skorotkiewicz</a>
</p>
