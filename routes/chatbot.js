// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { spawn } = require('child_process');
// const path = require('path');

// // Start Flask server when this route module is loaded
// let flaskProcess;
// const startChatbotServer = () => {
//     console.log('Starting chatbot server...');
    
//     const chatbotPath = path.join(__dirname, '..', 'chatbot-deployment', 'app.py');
//     flaskProcess = spawn('python', [chatbotPath], { 
//         cwd: path.join(__dirname, '..', 'chatbot-deployment')
//     });

//     flaskProcess.stdout.on('data', (data) => {
//         console.log(`Chatbot server: ${data}`);
//     });

//     flaskProcess.stderr.on('data', (data) => {
//         console.log(`Chatbot server error: ${data}`);
//     });

//     flaskProcess.on('close', (code) => {
//         console.log(`Chatbot server process exited with code ${code}`);
//     });
// };

// // Start the chatbot server
// startChatbotServer();

// // Route to render the chatbot interface
// router.get('/', (req, res) => {
//     res.render('chatbot');
// });

// // API route to proxy requests to the Flask backend
// router.post('/api/message', async (req, res) => {
//     try {
//         const response = await axios.post('http://localhost:5000/predict', {
//             message: req.body.message
//         });
        
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error communicating with chatbot server:', error);
//         res.status(500).json({ error: 'Failed to get response from chatbot' });
//     }
// });

// module.exports = router;



