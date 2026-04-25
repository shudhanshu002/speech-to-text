import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

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
      if (e.altKey && e.key.toLowerCase() === 'm') {
        toggleListening();
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
    } else {
      shouldListenRef.current = true; // Enable auto-restart
      setAiResponse("");
      recognitionRef.current.start();
      setIsListening(true);
    }
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
        <h2 style={{ color: '#76b900', marginTop: 0 }}>NVIDIA Voice Assistant</h2>
        <p style={styles.shortcutText}>Press <strong>Alt + M</strong> to toggle microphone</p>

        <div style={styles.status}>
          <span style={{ color: isListening ? '#76b900' : '#ff4444' }}>
            {isListening ? '🎤 Listening... (Go ahead and pause, it will keep listening)' : '⏸ Microphone Off'}
          </span>
        </div>

        <button 
          onClick={toggleListening} 
          style={isListening ? styles.btnStop : styles.btnStart}
        >
          {isListening ? "Stop Recording" : "Start Recording"}
        </button>

        <div style={styles.transcriptBox}>
          {/* Saved text */}
          <span>{fullTranscript}</span>
          {/* Live text (faded) */}
          <span style={{ color: '#aaa', fontStyle: 'italic' }}>{interimTranscript}</span>
          {!fullTranscript && !interimTranscript && "Speak to generate text..."}
        </div>

        <button 
          onClick={processWithNvidia} 
          disabled={loading || (!fullTranscript && !interimTranscript)} 
          style={styles.btnProcess}
        >
          {loading ? "NVIDIA Processing..." : "Process with AI"}
        </button>

        {aiResponse && (
          <div style={styles.responseBox}>
            <h4 style={{ color: '#76b900', margin: '0 0 10px 0' }}>AI Response:</h4>
            <p style={{ margin: 0 }}>{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif', padding: '20px' },
  card: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' },
  shortcutText: { fontSize: '0.85rem', color: '#888', marginBottom: '20px' },
  status: { marginBottom: '15px', fontWeight: '600' },
  transcriptBox: { backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', minHeight: '100px', margin: '20px 0', border: '1px solid #444', fontSize: '1.1rem', lineHeight: '1.5' },
  btnStart: { width: '100%', padding: '15px', backgroundColor: '#76b900', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  btnStop: { width: '100%', padding: '15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  btnProcess: { width: '100%', padding: '15px', backgroundColor: '#ffffff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  responseBox: { marginTop: '20px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #76b900', whiteSpace: 'pre-wrap' }
};

export default App;