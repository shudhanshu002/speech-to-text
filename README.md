# 🎙️ AI Voice Assistant

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_API-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)

> A smart, continuous Speech-to-Text (STT) assistant powered by React and the NVIDIA NIM API. Speak naturally, let the app transcribe it continuously, and then use AI to clean up and respond to your thoughts!

🔗 **[Live Demo](#)** *(Replace with your deployed link)*  
💻 **[GitHub Repository](#)** *(Replace with your GitHub repo URL)*  

---

## ✨ Features

- **Continuous Listening**: Built-in logic to prevent the browser from automatically stopping the microphone when you pause. Take your time, think, and speak!
- **AI Cleanup**: Uses the incredibly fast `meta/llama-3.1-8b-instruct` model via NVIDIA's API to clean up your messy transcripts and respond intelligently.
- **Manual Editing**: Sometimes STT makes a mistake. You can seamlessly type and edit the transcript directly in the text box before sending it to the AI.
- **Text-to-Speech (TTS)**: Don't feel like reading? Click the "🔊 Read Aloud" button and the app will speak the AI's response back to you.
- **Quick Tools**: Handy buttons to instantly copy your transcript to the clipboard or clear everything and start fresh.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Speech API**: Native Web Speech API (`webkitSpeechRecognition`) & Speech Synthesis
- **AI Integration**: OpenAI JS SDK (configured to route through a local Vite proxy to NVIDIA NIM endpoints to bypass browser CORS).

---

## 🚀 Getting Started

Want to run this locally? Here's how to get it up and running in minutes.

### 1. Clone & Install
```bash
git clone <YOUR_GITHUB_REPO_URL_HERE>
cd stt-nvidia
npm install
```

### 2. Environment Variables
You'll need an NVIDIA API key. Create a `.env` file in the root of the project and add your key:
```env
VITE_NVIDIA_API_KEY=your_nvidia_api_key_here
```

### 3. Run the App
```bash
npm run dev
```
Open up your browser to `http://localhost:5173`. Make sure you're using **Google Chrome** or another browser that fully supports the Web Speech API!

---

## 💡 How It Works (Behind the Scenes)

- **CORS Bypass**: Calling the NVIDIA API directly from the frontend usually results in a CORS error. This project uses Vite's built-in proxy (`vite.config.js`) to seamlessly route `/api/nvidia` traffic to the real API.
- **The "Stale State" Fix**: Toggling the mic with keyboard shortcuts can sometimes cause bugs in React due to stale closures. We fixed this by programmatically triggering a button click!

---

*Built with ❤️ and way too much coffee.*
