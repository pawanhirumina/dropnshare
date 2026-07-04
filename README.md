# 📤 Drop & Share (Dragnshare)

> **Simple, meaningful, and temporary file sharing.**  
> Upload files, get a 6-digit code, and share it. No logins, no hassle.

![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📖 About

**Drop & Share** is a modern web application designed for quick and secure file sharing. It solves the problem of sharing files between devices or people without creating accounts or dealing with complex permissions. 

simply drag and drop your files, receive a unique **6-digit code**, and use that code to download your files on any other device. All files are automatically bundled into a standard `.zip` archive for easy downloading and are deleted after **24 hours** to ensure privacy.

## ✨ Features

-   **📦 Smart Zip Bundling**: Automatically compresses multiple files into a single `archive.zip` before uploading.
-   **🔐 Secure 6-Digit Codes**: unique, short codes for easy sharing.
-   **⚡ Fast & Reactive**: Built with Vite for lightning-fast performance.
-   **🎨 Beautiful UI**: Modern interface with smooth animations and FontAwesome icons.
-   **⏳ Auto-Expiration**: Files are automatically removed after 24 hours.
-   **🔒 Secure Downloads**: Enforced Content-Type headers ensure files always download correctly.

## 🛠️ Built With

This project uses a modern, lightweight technology stack:

-   **Frontend**: HTML5, CSS3 (Variables + Animations), Vanilla JavaScript (ES6+)
-   **Build Tool**: [Vite](https://vitejs.dev/) - For fast development and environment management.
-   **Backend / Storage**: [Supabase](https://supabase.com/) - Database (PostgreSQL) and Object Storage.
-   **Utilities**: [JSZip](https://stuk.github.io/jszip/) - Client-side file compression.
-   **Icons**: [FontAwesome](https://fontawesome.com/) - Vector icons.

## 🚀 How to Use

### Uploading (Sender)
1.  Open the **Drop & Share** homepage.
2.  Drag and drop your files (Images, Documents, etc.) into the drop zone.
3.  Click **"Upload All Files"**.
4.  Copy the generated **6-digit code**.

### Downloading (Receiver)
1.  Go to the **Download Page** (click "Download" in the header).
2.  Enter the **6-digit code**.
3.  Click **"Get File"**.
4.  Your files will download instantly as a `.zip` archive.

## 💻 Local Development Setup

To run this project locally:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/dragnshare.git
    cd dragnshare
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` in your browser.

---
*Made with ❤️ by [Your Name]*
