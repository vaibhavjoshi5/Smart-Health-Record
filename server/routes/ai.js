const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authMiddleware } = require('./auth');

// POST /symptom-advice
router.post('/symptom-advice', authMiddleware, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ message: 'Symptoms required' });
    
    // Simple rule-based advice (Free alternative)
    const advice = generateSimpleAdvice(symptoms);
    res.json({ advice });
    
    /* OpenAI API Code (Commented out - requires paid API key)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'OpenAI API key not set' });
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant. Provide brief, friendly, non-diagnostic health advice.'
          },
          {
            role: 'user',
            content: `A patient describes these symptoms: ${symptoms}. Give brief health advice or next steps.`
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const advice = response.data.choices[0].message.content.trim();
    */
  } catch (err) {
    res.status(500).json({ message: 'Error getting advice', error: err.message });
  }
});

// Simple rule-based advice function (Free alternative)
function generateSimpleAdvice(symptoms) {
  const symptomsLower = symptoms.toLowerCase();
  
  if (symptomsLower.includes('fever') || symptomsLower.includes('temperature')) {
    return "🌡️ For fever: Rest, drink plenty of fluids, and consider paracetamol. If fever persists for more than 3 days or is very high, consult a doctor.";
  }
  
  if (symptomsLower.includes('headache') || symptomsLower.includes('head pain')) {
    return "🤕 For headache: Try to rest in a quiet, dark room. Stay hydrated and consider mild pain relief. If severe or persistent, please see a healthcare provider.";
  }
  
  if (symptomsLower.includes('cough') || symptomsLower.includes('cold')) {
    return "🤧 For cough/cold: Rest, drink warm fluids, and consider honey for throat relief. If cough persists for more than a week, consult a doctor.";
  }
  
  if (symptomsLower.includes('stomach') || symptomsLower.includes('nausea') || symptomsLower.includes('vomit')) {
    return "🤢 For stomach issues: Try bland foods (rice, toast), stay hydrated with small sips of water. If severe or persistent, seek medical attention.";
  }
  
  if (symptomsLower.includes('chest pain') || symptomsLower.includes('breathing')) {
    return "⚠️ For chest pain or breathing issues: This could be serious. Please consult a healthcare provider immediately or visit the emergency room.";
  }
  
  // Default advice
  return "🏥 Based on your symptoms, I recommend: 1) Rest and stay hydrated, 2) Monitor your symptoms, 3) Consult a healthcare provider if symptoms worsen or persist. This is general advice and not a substitute for professional medical consultation.";
}

module.exports = { router }; 