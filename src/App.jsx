import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { styles } from './styles';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_NVIDIA_API_KEY,
  baseURL: `${window.location.origin}/api/nvidia`,
  dangerouslyAllowBrowser: true
});

function App() {
  const [fullTranscript, setFullTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const [aiResponse, setAiResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + " ";
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        // Append completed sentences to the main text
        if (finalStr) {
          setFullTranscript((prev) => prev + finalStr);
        }
        // Update live preview
        setInterimTranscript(interimStr);
      };

      // Restart mic automatically if it stops on its own
      recognitionRef.current.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognitionRef.current.start();
          } catch(e) {
            console.error("Restart error", e);
          }
        } else {
          setIsListening(false);
        }
      };
    }

    const handleKeyDown = (e) => {
      // Use Alt+M for toggle via button click to bypass stale closure states
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) micBtn.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Browser not supported. Use Chrome.");
    
    if (isListening) {
      shouldListenRef.current = false; // Stop auto-restart
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      shouldListenRef.current = true; // Enable auto-restart
      setAiResponse("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle manual typing
  const handleManualEdit = (e) => {
    setFullTranscript(e.target.value);
    setInterimTranscript(""); // Clear interim so it doesn't duplicate
  };

  // Copy text
  const copyToClipboard = () => {
    const textToCopy = fullTranscript + interimTranscript;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      alert("Copied to clipboard! 📋");
    }
  };

  // Clear all text
  const clearAll = () => {
    setFullTranscript("");
    setInterimTranscript("");
    setAiResponse("");
  };

  // Text to speech
  const readAloud = () => {
    if (!aiResponse) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(aiResponse);
    window.speechSynthesis.speak(utterance);
  };

  const processWithNvidia = async () => {
    const completeText = fullTranscript + interimTranscript;
    if (!completeText.trim()) return;
    
    setLoading(true);
    try {
      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct", 
        messages: [{ role: "user", content: `Clean up this speech transcript and respond politely: "${completeText}"` }],
        max_tokens: 512,
      });
      setAiResponse(completion.choices[0].message.content);
    } catch (error) {
      console.error(error);
      setAiResponse("NVIDIA API Error. Check your API key in .env.local.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#76b900', marginTop: 0 }}> Voice Assistant</h2>
        <p style={styles.shortcutText}>Press <strong>Btn</strong> to toggle microphone</p>

        <div style={styles.status}>
          <span style={{ color: isListening ? '#76b900' : '#ff4444' }}>
            {isListening ? '🎤 Listening... (Go ahead and pause, it will keep listening)' : '⏸ Microphone Off'}
          </span>
        </div>

        <button 
          id="mic-btn"
          onClick={toggleListening} 
          style={isListening ? styles.btnStop : styles.btnStart}
        >
          {isListening ? "Stop Recording" : "Start Recording"}
        </button>

        {/* Toolbar */}
        <div style={styles.toolbar}>
           <button onClick={copyToClipboard} style={styles.iconBtn}>📋 Copy</button>
           <button onClick={clearAll} style={styles.iconBtn}>🗑️ Clear</button>
        </div>

        {/* Editable Transcript Area */}
        <textarea 
          style={styles.transcriptBox}
          value={fullTranscript + interimTranscript}
          onChange={handleManualEdit}
          placeholder="Speak to generate text or type manually here..."
        />

        <button 
          onClick={processWithNvidia} 
          disabled={loading || (!fullTranscript && !interimTranscript)} 
          style={styles.btnProcess}
        >
          {loading ? "NVIDIA Processing..." : "Process with AI"}
        </button>

        {aiResponse && (
          <div style={styles.responseBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <h4 style={{ color: '#76b900', margin: 0 }}>AI Response:</h4>
               <button onClick={readAloud} style={styles.readBtn}>🔊 Read Aloud</button>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;