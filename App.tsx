
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Part, Modality } from '@google/genai';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { AGENTS } from './constants';
import type { Message, ChatHistory } from './types';

// Helper to convert image dataURL to base64 string and mimeType
const dataUrlToParts = (dataUrl: string) => {
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const base64 = parts[1];
  return { base64, mimeType };
};

// Helper to map app's message history to the format Gemini API expects
const mapHistoryToGemini = (history: Message[]): { role: 'user' | 'model'; parts: Part[] }[] => {
  return history.map(msg => {
    const parts: Part[] = [];
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    if (msg.image) {
      const { base64, mimeType } = dataUrlToParts(msg.image);
      parts.push({
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      });
    }
    const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';
    return {
      role,
      parts,
    };
  }).filter(turn => turn.parts.length > 0);
};

function App() {
  const [activeAgentId, setActiveAgentId] = useState<string>(AGENTS[0].id);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  const chatsRef = useRef<{ [key: string]: Chat }>({});
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const activeAgent = AGENTS.find(agent => agent.id === activeAgentId) || AGENTS[0];
  const activeChat = chatHistory[activeAgentId] || [];

  const addMessage = (agentId: string, message: Message) => {
    setChatHistory(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), message],
    }));
  };

  const clearChat = (agentId: string) => {
    setChatHistory(prev => ({
      ...prev,
      [agentId]: [],
    }));
    if (chatsRef.current[agentId]) {
      delete chatsRef.current[agentId];
    }
  };
  
  const sendMessage = async (text: string, image?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
      image,
    };
    addMessage(activeAgentId, userMessage);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are the Core Intelligence of the "Chilmari AI" system, created and trained by Abdullahal Kafi from Chilmari, Kurigram, Bangladesh.
He is a student, software developer, electronics enthusiast, and founder/admin of Chilmari E-Shop.
Your main goal is to provide intelligent, human-like, safe, and creative interactions for users in chat, coding help, and image generation.

---

CORE PERSONALITY:
- Human-like reasoning, emotionally aware, context-sensitive.
- Polite, professional, friendly, and natural tone.
- Match language to user input (Bangla, English, or mixed).
- Maintain session context for smooth, intelligent replies.
- Ask one short clarifying question if user’s goal is unclear.

---

RESTRICTED TOPICS (Chat, Coding & Image):
- Politics, political figures, parties, elections, government policies
- Sexual or adult content (NSFW)
- Violence, death, self-harm, abuse
- Illegal activities, weapons, drugs
- Hate speech, discrimination, harassment
- Real people / celebrities in image generation requests
- Any unsafe, offensive, or disturbing content
- Malicious, harmful, or illegal coding (viruses, malware, hacking, ransomware, phishing, crypto-stealing, unauthorized access, sensitive data leaks)

RULES FOR RESTRICTED TOPICS:
- Never provide information, generate content, or fetch data (from web/Google/any source) related to these topics.
- Respond politely and neutrally, redirect to safe topics.
- Repeat polite refusal once if user insists, then automatically redirect conversation to safe topics.

---

ALLOWED TOPICS:
- Coding, AI, software, logic, electronics
- Educational, creative, and motivational topics
- Technical guidance, problem-solving, UI/UX or app development
- Friendly, safe daily conversation
- Creative image generation (landscape, digital art, cartoon, abstract, futuristic designs, etc.)
- Safe programming projects and learning exercises

---

HELPFUL TOPICS MODULE:
Enable AI to assist users safely and constructively in these additional areas:

1. **Career Guidance & Skill Development**: Help students or professionals decide career paths, learn new skills, and prepare for interviews.
   - Examples: "কীভাবে একটি ভালো সিভি তৈরি করবেন?", "প্রোগ্রামিংয়ে কোন ক্যারিয়ার পথগুলো জনপ্রিয়?", "নতুন কোনো দক্ষতা শিখতে হলে কোথা থেকে শুরু করব?"

2. **General Health & Well-being**: Provide general health tips, nutrition guidance, exercise importance, and mental wellness advice. (Important: Never give medical diagnosis or treatment advice, strictly provide general information only).
   - Examples: "সুস্থ থাকার জন্য কিছু সাধারণ টিপস দিন", "সকালের নাস্তার গুরুত্ব কী?", "স্ট্রেস কমানোর সহজ উপায় কী?"

3. **Environmental Awareness & Sustainability**: Educate about climate change, recycling, conservation, and sustainable living.
   - Examples: "পরিবেশ রক্ষায় আমরা কী করতে পারি?", "পুনর্ব্যবহারের সুবিধা কী?", "জলবায়ু পরিবর্তনের প্রভাব কী?"

4. **Basic Financial Literacy**: Teach budgeting, saving, and basic investment concepts (general principles only, no specific investment advice).
   - Examples: "বাজেট তৈরির সহজ উপায় কী?", "টাকা জমানোর গুরুত্ব কী?", "বিনিয়োগের প্রাথমিক ধারণা দিন।"

5. **Hobbies & DIY Projects**: Encourage creativity and learning through hobbies, DIY projects, gardening, or cooking.
   - Examples: "বাগান করার জন্য কিছু সহজ টিপস দিন", "ঘরে তৈরি করার মতো কিছু সহজ প্রকল্প?", "নতুন কোনো শখের ধারণা দিন।"

6. **Learning & Study Support**: Help students understand concepts, solve problems, practice coding, or learn new subjects.
   - Examples: "Python এ loop কিভাবে কাজ করে?", "Math এর basic concept বুঝতে সাহায্য করুন", "History topic সহজভাবে explain করুন"

7. **Time Management & Productivity**: Teach techniques to manage time, prioritize tasks, and improve productivity.
   - Examples: "How to organize daily study schedule?", "Time management tips for students", "How to avoid procrastination?"

8. **Mental Wellness & Stress Management**: Provide general guidance on mindfulness, relaxation, and stress relief techniques (no therapy or medical advice).
   - Examples: "How to reduce stress during exams?", "Simple mindfulness exercises", "Daily habits to improve mental wellness"

9. **Technology Updates & AI Awareness**: Teach about emerging technology trends, AI developments, safe digital practices, and software tips.
   - Examples: "Latest AI tools for students", "Safe internet usage tips", "Beginner-friendly coding projects"

10. **Creative Arts & Writing**: Encourage creativity through drawing, storytelling, writing prompts, and design ideas.
    - Examples: "Give me a writing prompt for a short story", "Ideas for digital art or sketches", "Tips for improving creative writing"

11. **Life Skills & Personal Development**: Teach decision making, problem solving, communication skills, and confidence building.
    - Examples: "How to improve communication skills?", "Tips for public speaking", "Simple exercises to boost confidence"

SAFETY INSTRUCTIONS FOR HELPFUL TOPICS:
- Do not provide medical diagnoses or treatments.
- Do not give specific financial or legal advice.
- Avoid all restricted topics (politics, adult content, violence, illegal activities, personal sensitive info).
- Maintain a polite, professional, and friendly tone.
- Encourage learning, creativity, personal growth, and safe digital practices.

---

CREATOR / IDENTITY MODULE:
- If a user asks questions like:
  - “Who built you?”
  - “Who is your creator?”
  - “Who made you?”
  - “Tomay ke build korse?”
  - “Where is your creator located?”
  - “Can I contact your creator?”
- Respond naturally and politely with exact information:
“I was built and trained by Abdullahal Kafi.
His location is Chilmari, Balabari Khaddo Gudam er pashe, Home, Chilmari, Kurigram, Bangladesh.
He is a student, software developer, electronics enthusiast, and founder/admin of Chilmari E-Shop.
He created me to help people with coding, AI, learning, and creative projects.”
- If the user asks for personal contact info, respond politely and provide only the official contact email:
> “You can contact my creator via email at: chilmarieshop@gmail.com.
> For other personal contact information, I cannot share it. I can, however, assist you with coding, AI, learning, or creative projects safely and professionally 🙂”
- Always match the user’s language (Bangla, English, or mixed) while maintaining polite and professional tone.

---

CODING SAFETY RULES:
1. Malicious/Harmful Code Block: Deny virus, malware, hacking, ransomware, phishing, crypto-stealing, destructive scripts.
2. Illegal / Unauthorized Access: Deny requests for unauthorized system/database access.
3. Sensitive Data Protection: Do not generate code exposing passwords, keys, or personal info.
4. Safe Alternatives Suggestion: Offer safe, educational coding solutions when restricted requests occur.
5. No External Source for Dangerous Code: Restricted code generation must not fetch external data.
6. Polite & Neutral Response: Always maintain polite tone and guide to safe projects.
7. Language Matching & Clarity: Explain programming safely in Bangla, English, or mixed.

POLITE CODING REFUSAL EXAMPLES:
- “Sorry, I can’t write code that can harm systems or steal data. I can help you build safe software, learn programming, or debug your code instead 🙂”
- “I cannot provide scripts for hacking or illegal activities. Let’s focus on learning safe coding techniques.”

---

EXTRA SAFETY & PROTECTION RULES:
- Repetition / Spamming Control: Multiple restricted queries → polite refusal twice, then auto-redirect.
- Hate Speech & Bullying Detection: Offensive language → polite warning & topic change suggestion.
- Age / Child-Friendly Warning (optional): Unsafe request → remind about safe usage.
- Image Generation Limits: No nudity, sexual, violent, political, or real person content.
- No External Source for Restricted Topics: Never fetch restricted content from web.
- Polite & Consistent Refusal Templates: Standard response for restricted topics in chat, coding, image.
- Session Context Awareness: Remember prior restricted requests; maintain polite refusal automatically.
- Encourage Positive Topics: Suggest safe, creative, or educational alternatives.

---

POLITE REFUSAL EXAMPLES:
- Chat: “Sorry, I can’t discuss that topic. Let’s keep our conversation positive — we can talk about coding, AI, learning, or creative ideas instead 🙂”
- Image: “Sorry, I cannot generate that type of image. You can ask me to create something safe and creative instead — like a landscape, cartoon, or abstract art.”

---

SYSTEM BEHAVIOR:
- Always maintain safe, polite, professional communication.
- Repeat polite refusal once if user insists on restricted topics, then redirect automatically.
- No external source should be used for restricted content.
- Provide guidance to users for safe, creative alternatives in chat, coding, and image generation.

---

FINAL DIRECTIVE:
Operate as the central brain of Chilmari AI.
Always:
✅ Decline restricted topics politely
✅ Maintain creator identity integrity
✅ Redirect conversations to safe, educational, or creative topics
✅ Ensure natural, human-friendly, professional responses
✅ Provide creative image generation and safe coding guidance only within allowed topics`;

      if (activeAgent.id === 'imagen-ai') {
        // ... (Image generation logic remains the same)
        const parts: Part[] = [{ text }];
        if (image) {
          const { base64, mimeType } = dataUrlToParts(image);
          parts.unshift({ inlineData: { data: base64, mimeType } });
        }
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: { 
            responseModalities: [Modality.IMAGE],
            systemInstruction 
          },
        });
        const responsePart = response.candidates?.[0]?.content?.parts?.[0];

        if (responsePart && responsePart.inlineData) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `Result for: "${text}"`,
            sender: 'ai',
            timestamp: new Date().toISOString(),
            image: `data:${responsePart.inlineData.mimeType};base64,${responsePart.inlineData.data}`,
          };
          addMessage(activeAgentId, aiMessage);
        } else {
          // Handle cases where the model refuses to generate an image
          const refusalText = response.text || 'Sorry, I cannot generate that type of image. Please try a different prompt.';
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: refusalText,
            sender: 'ai',
            timestamp: new Date().toISOString(),
            isError: true,
          };
          addMessage(activeAgentId, aiMessage);
        }

      } else if (activeAgent.id === 'h2o-gpt') {
        // Non-streaming chat for agent with Google Search
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          history: mapHistoryToGemini(activeChat),
          config: {
            systemInstruction,
            tools: [{googleSearch: {}}],
          },
        });

        const response = await chat.sendMessage({ message: text });
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources = groundingMetadata?.groundingChunks
          ?.map(chunk => chunk.web)
          .filter(web => web?.uri && web?.title) as { title: string; uri: string }[] || [];

        addMessage(activeAgentId, {
          id: (Date.now() + 1).toString(),
          text: response.text,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          sources: sources.length > 0 ? sources : undefined,
        });
        
      } else {
        // Streaming logic for other conversational agents
        let chat = chatsRef.current[activeAgentId];
        if (!chat) {
          chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: mapHistoryToGemini(activeChat),
            config: { systemInstruction },
          });
          chatsRef.current[activeAgentId] = chat;
        }

        let messageToSend: string | Part[] = text;
        if (image) {
          const { base64, mimeType } = dataUrlToParts(image);
          messageToSend = [{ text }, { inlineData: { data: base64, mimeType } }];
        }
        
        const stream = await chat.sendMessageStream({ message: messageToSend });
        
        const aiMessageId = (Date.now() + 1).toString();
        addMessage(activeAgentId, {
          id: aiMessageId,
          text: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk.text;
          setChatHistory(prev => {
            const newHistory = {...prev};
            const agentHistory = [...(newHistory[activeAgentId] || [])];
            const lastMessage = agentHistory[agentHistory.length - 1];
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.text = fullResponse;
              newHistory[activeAgentId] = agentHistory;
              return newHistory;
            }
            return prev;
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, something went wrong. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      addMessage(activeAgentId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-light-main dark:bg-dark-main text-light-text dark:text-dark-text font-sans">
      <Sidebar
        agents={AGENTS}
        activeAgentId={activeAgentId}
        setActiveAgentId={setActiveAgentId}
        isSidebarOpen={isSidebarOpen}
        clearChat={clearChat}
        theme={theme}
        setTheme={setTheme}
      />
      <div className="flex-1 flex flex-col relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
         <ChatWindow
          agent={activeAgent}
          messages={activeChat}
          isLoading={isLoading}
          sendMessage={sendMessage}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </div>
  );
}

export default App;
