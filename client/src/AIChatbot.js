import React, { useState, useRef, useEffect } from 'react';
import { authFetch } from './utils';

function AIChatbot() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setChat([...chat, { sender: 'user', text: input }]);
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/symptom-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: input })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChat(c => [...c, { sender: 'ai', text: data.advice || data.message || 'No response' }]);
      } else {
        const errorData = await res.json();
        setChat(c => [...c, { sender: 'ai', text: errorData.message || 'AI service unavailable' }]);
      }
    } catch (err) {
      console.error('AI Chatbot error:', err);
      setChat(c => [...c, { sender: 'ai', text: '🤖 AI service is temporarily unavailable. Please try again later.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ border: '1px solid #ccc', padding: 24, borderRadius: 12, maxWidth: 400, width: '100%', background: '#23272f' }}>
        <h3 style={{ textAlign: 'center', color: '#b7aaff', letterSpacing: 1 }}>AI Symptom Advice</h3>
        <div style={{ 
          minHeight: 180, 
          maxHeight: 300, 
          overflowY: 'auto', 
          marginBottom: 12, 
          background: '#181c24', 
          borderRadius: 8, 
          padding: 12, 
          borderTop: '2px solid #444',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
        }}>
          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                margin: '6px 0',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  background: msg.sender === 'user' ? '#4b3fa7' : '#2d323c',
                  color: '#f5f6fa',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  wordBreak: 'break-word',
                }}
              >
                <span style={{ fontWeight: 600, color: msg.sender === 'user' ? '#b7aaff' : '#7c4dff', marginRight: 6 }}>
                  {msg.sender === 'user' ? 'You:' : 'AI:'}
                </span>
                <span>{msg.text}</span>
              </div>
            </div>
          ))}
          {loading && <div><i>AI is typing...</i></div>}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: 'calc(100% - 80px)',
              boxSizing: 'border-box',
              background: '#181c24',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: 6,
              padding: '8px',
              resize: 'none',
              overflowY: 'auto',
              fontFamily: 'inherit',
              fontSize: '1rem',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
              }
            }}
          />
          <button type="submit" disabled={loading} style={{ minWidth: '70px', flexShrink: 0, borderRadius: 6, background: '#fff', color: '#23272f', fontWeight: 'bold', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatbot; 