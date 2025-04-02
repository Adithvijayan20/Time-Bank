const express = require('express');
const router = express.Router();
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Variable to track if the server is already running
let isServerRunning = false;
let flaskProcess;

// Start Flask server when this route module is loaded
const startChatbotServer = () => {
    if (isServerRunning) {
        console.log('Chatbot server is already running');
        return;
    }
    
    console.log('Starting chatbot server...');
    
    const chatbotPath = path.join(__dirname, '..', 'chatbot-deployment', 'app.py');
    flaskProcess = spawn('python', [chatbotPath], { 
        cwd: path.join(__dirname, '..', 'chatbot-deployment')
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Chatbot server: ${data}`);
        // If we see the server started, mark it as running
        if (data.toString().includes('Running on')) {
            isServerRunning = true;
        }
    });

    flaskProcess.stderr.on('data', (data) => {
        console.error(`Chatbot server error: ${data}`);
    });

    flaskProcess.on('close', (code) => {
        console.log(`Chatbot server process exited with code ${code}`);
        isServerRunning = false;
    });
    
    // Add a health check to make sure server is running
    setTimeout(checkServerHealth, 5000);
};

const checkServerHealth = async () => {
    try {
        await axios.get('http://localhost:5000/');
        console.log('Chatbot server is healthy');
    } catch (error) {
        console.error('Chatbot server health check failed:', error.message);
        // Restart if needed
        if (isServerRunning) {
            isServerRunning = false;
            if (flaskProcess) {
                try {
                    flaskProcess.kill();
                } catch (e) {
                    console.error('Error killing process:', e);
                }
            }
            startChatbotServer();
        }
    }
};

// Start the chatbot server
startChatbotServer();

// Route to render the chatbot interface
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'chatbot-deployment', 'templates', 'base.html'));
});

// Serve static files from the chatbot-deployment/static directory
router.use('/static', express.static(path.join(__dirname, '..', 'chatbot-deployment', 'static')));

// API route to proxy requests to the Flask backend
router.post('/api/message', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5000/predict', {
            message: req.body.message
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error communicating with chatbot server:', error);
        res.status(500).json({ error: 'Failed to get response from chatbot', details: error.message });
    }
});

// Clean up the Flask process when the Node.js server exits
process.on('exit', () => {
    if (flaskProcess) {
        flaskProcess.kill();
    }
});

module.exports = router;