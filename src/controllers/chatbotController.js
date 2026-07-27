const fetch = require('node-fetch') || global.fetch;

const CONTEXT = `
You are an AI assistant for Saurabh Srivastav and WEB 3 TASK PRIVATE LIMITED. Use the following context to answer questions when relevant.

Context about Saurabh Srivastav:
- Email: saurabhsri.mau@gmail.com, Mobile: +91-6306259516
- Education: Ajay Kumar Garg Engineering College, B.Tech- CSE (GPA: 8.72) (Oct 2023-Jun 2027)
- Skills: Java, C, JS, TS, HTML, CSS, ReactJS, Tailwind CSS, NodeJS, ExpressJS, Spring Boot, PostgreSQL, MongoDB, Redis, Docker, AWS, Kafka.
- Experience: 
  1. Backend Developer at Cloud Computing Cell (Oct 2024-Present).
  2. Full Stack Developer Intern at MacroCosmos Creations Pvt Ltd (Nov 2025-May 2026).
- Projects: QuizApp, MyFinance, Scalable Backend Deployment on AWS, Microservices-Based Social Media Backend.

Context about WEB 3 TASK PRIVATE LIMITED:
- We help startups scale with strong SaaS, conversion-ready dashboards, and integrated tech, AI, design, and automation solutions.
- 4+ years of experience, 500+ projects delivered, 99% client satisfaction rate, ISO certified (9001:2015, 27001:2022).
- Leaders: 
  - Sumit Nagar (Co-Founder & CEO): Charts strategic direction, philosophy is 'vision with execution'.
  - Sandeep Rana (CTO): Architect behind scalable platforms, deep roots in blockchain, mantra 'Build so it never breaks'.
  - Akash Sharma (CMO): Translates powerful tech into narratives.
  - Pulkit Sharma (CFO): Strategic mind ensuring long-term viability.
`;

const chat = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'GROQ_API_KEY is not configured in environment variables.' });
        }

        const messages = [
            { role: 'system', content: CONTEXT },
            ...history,
            { role: 'user', content: message }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API Error: ${error}`);
        }

        const data = await response.json();
        
        res.status(200).json({
            success: true,
            reply: data.choices[0].message.content
        });

    } catch (error) {
        console.error('Chatbot Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to process chat request' });
    }
};

module.exports = {
    chat
};
