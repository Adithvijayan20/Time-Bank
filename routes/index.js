

// module.exports = router;
//role based

const { LocalStorage } = require('node-localstorage');

// Initialize localStorage
const path = require('path');

// Use a directory within your project or a temporary directory
const localStorage = new LocalStorage(path.join(__dirname, 'localStorage'));
var express = require('express');
var router = express.Router();
const multer = require('multer');
const userHelpers = require('../helpers/user_helpers');
const db = require('../config/connection');
const { getGFS } = require('../config/connection');
const passport = require('passport');
const collection = require('../config/collections');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const upload = multer({ storage: multer.memoryStorage() });
const getPatientVolunteerMatches = require('../helpers/helper'); // Ensure the correct path
 const bcrypt = require('bcrypt')
 const twilio = require('twilio');

 const puppeteer = require('puppeteer');
const { ObjectId } = require('mongodb');
const { Collection } = require('mongoose');
const axios = require('axios'); // Import Axios
const cheerio = require('cheerio');
require('dotenv').config();

//************************************
//const User = require('../models/user');

//********************************* 

const matchFunction=require('../helpers/helper')

router.get('/volunteer-profile-update', (req, res) => {
    res.render('volunteer-profile-update', { title: 'Express' });
});

router.get('/', (req, res) => {
    res.render('home', { title: 'Time bank private limited.ptv' });
});
    router.get('/admin', (req, res) => {
        res.render('admin', { title: 'Time bank private limited.ptv' });
});
router.get('/reg', function(req, res, next) {
    
  res.render('reg', { title: 'Time bank private limited.ptv' });
});
// 
router.get('/patient', (req, res) => {
    res.render('patient', { title: 'Time bank private limited.ptv' });
});


router.get('/signup', (req, res) => {
    res.render('index', { title: 'Time bank private limited.ptv' });
});
router.get('/matches', (req, res) => {
    res.render('matches', { title: 'Time bank private limited.ptv' });
});





//**********************************signup router


router.post('/signup', upload.single('idUpload'), async (req, res) => {
    try {
        // Pass form data and uploaded file to userHelpers
        req.body.role = req.body.role || 'volunteer';
        await userHelpers.doSignup(req.body, req.file);
        res.redirect('/login'); // Redirect to login page upon success
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('An error occurred during signup. Please try again.');
    }
});
//******************************** signup router



//****************************login router


router.get('/login', (req, res) => {
    res.render('login', { title: 'Time bank private limited.ptv' });
});



router.post('/login', async (req, res) => {
    try {
        const loginResponse = await userHelpers.doLogin(req.body);
        if (loginResponse.status) {
            if ((loginResponse.user.role === 'volunteer' || loginResponse.user.role === 'patient'|| loginResponse.user.role === 'institution') && !loginResponse.user.isActive) {
                return res.render('login', { message: "Contact admin" }); 
            }
            
            req.session.loggedIn = true;
            req.session.user = loginResponse.user;
            req.session.userId = loginResponse.user._id;

            // Check for user roles and redirect accordingly
            if (loginResponse.user.role === 'volunteer') {
                localStorage.setItem("volunteerId",loginResponse.user._id)
                req.session.volunteerId = loginResponse.user._id;
                res.redirect(`/volunteer-profile/${loginResponse.user._id}`);
            } else if (loginResponse.user.role === 'patient') {
                localStorage.setItem("patientId",`${loginResponse.user._id}`)
                res.redirect(`/patient-profile/${loginResponse.user._id}`);
            } else if (loginResponse.user.role === 'admin') {
                res.redirect('/admin');
            }
            else if (loginResponse.user.role === 'institution') {
                    res.redirect('/institutionhome');
                 // Redirect to admin dashboard
            } else {
                res.status(400).send('Invalid user role');
            }
        } else {
            res.status(401).send('Login failed');
        }
    } catch (error) {
        console.log(error.message);
        
        res.status(500).send('Error during login');
    }
});

//***************************logout
router.post('/logout', (req, res) => {
    // Destroy the session or handle logout logic
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Logout failed');
            }
            res.redirect('/'); // Redirect to the login page after logout
        });
    } else {
        res.redirect('/'); // Redirect even if no session exists
    }
});



// // //webscraping
// async function fetchElderlyNews() {
//     try {
//         const url = 'https://www.manoramaonline.com/';
//         const response = await axios.get(url, {
//             headers: { 
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//             }
//         });

//         const $ = cheerio.load(response.data);
//         let allHeadlines = [];

//         // Collect all headlines, no filtering yet
//         $('.story-card a, article a, .news-item a, h2 a, h3 a').each((index, element) => {
//             let text = $(element).text().trim();
//             if (text.length > 5) { // Reduce minimum length to see more
//                 allHeadlines.push(text);
//             }
//         });

//        // console.log("📰 ALL HEADLINES:", allHeadlines); // Log all headlines

//         return allHeadlines; // Return everything for testing
//     } catch (error) {
//         console.error("❌ Error fetching news:", error.message);
//         return [];
//     }
// }

// // Route to render elderly news page
// router.get('/elderly-news', async (req, res) => {
//     const elderlyNews = await fetchElderlyNews();
//     console.log("🔎 Sending headlines to template:", elderlyNews); // Debugging log
//     res.render('elderly-news', { headlines: elderlyNews.length ? elderlyNews : ["No elderly news found!"] });
// });

// //puppeteer

// const puppeteer = require('puppeteer');
// const { render } = require('../app');


// (async () => {
//     try {
//         const browser = await puppeteer.launch({
//             headless: true,
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//         });

//         const page = await browser.newPage();

//         // Increase timeout and handle errors
//         await page.goto('https://www.manoramaonline.com/', {
//             waitUntil: 'domcontentloaded', // Load faster, prevents timeout
//             timeout: 60000 // Increase timeout to 60s
//         });

//         // Get page content after JS loads
//         const content = await page.content();
//         const $ = cheerio.load(content);

//         let headlines = [];
//         $('article a, .story-card a, h2 a, h3 a').each((index, element) => {
//             let text = $(element).text().trim();
//             if (text.length > 10) {
//                 headlines.push(text);
//             }
//         });

//         //console.log("📰 Filtered News Headlines for Elderly:", headlines.length ? headlines : "❌ No relevant news found!");
        
//         await browser.close();
//     } catch (error) {
//         console.error("❌ Error:", error);
//     }
// })();


async function fetchKeralaHealthNews() {
    try {
        console.log("🔎 Fetching Kerala Health News...");
        const url = "https://www.manoramaonline.com/health.html"; // Use direct health section
        const response = await axios.get(url, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(response.data);
        let healthNews = [];

        $(".story-card a, .news-item a, h2 a, h3 a").each((index, element) => {
            let title = $(element).text().trim();
            let link = $(element).attr("href");
            
            if (title.length > 10 && link) {
                healthNews.push({
                    title,
                    url: link.startsWith("http") ? link : `https://www.manoramaonline.com${link}`
                });
            }
        });

        if (healthNews.length === 0) {
            console.warn("⚠️ No health news found!");
            return [];
        }

        console.log(`✅ Found ${healthNews.length} health articles.`);
        return healthNews.slice(0, 5); // Limit to top 5 news

    } catch (error) {
        console.error("❌ Error fetching health news:", error.message);
        return [];
    }
}

// Route to serve health news
router.get("/elderly-news", async (req, res) => {
    const healthNews = await fetchKeralaHealthNews();
    res.render("elderly-news", { articles: healthNews });
});





//******************************
// // Function to fetch elderly health news from NewsAPI (India & Kerala-specific)
// async function fetchElderlyNews() {
//     try {
//         const apiKey = "0381703ce56f4cc8817d279a869a4098"; // Your API Key
//         const url = `https://newsapi.org/v2/everything?q=(elderly OR senior citizens OR aging) AND health AND (India OR Kerala)&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
        
//         const response = await axios.get(url);
//         let articles = response.data.articles;

//         if (!articles || articles.length === 0) {
//             return ["No elderly health news found for India or Kerala!"];
//         }

//         // Filter Indian and Kerala-specific sources
//         const indianSources = [
//             "The Times of India", "Hindustan Times", "NDTV", "The Hindu",
//             "Indian Express", "India Today", "Deccan Herald", "The Quint", "Scroll.in",
//             "Mathrubhumi", "Malayala Manorama", "The New Indian Express Kerala"
//         ];
//         articles = articles.filter(article => indianSources.includes(article.source.name));

//         if (articles.length === 0) {
//             return ["No elderly health news from Indian or Kerala sources found!"];
//         }

//         // Extract necessary fields
//         return articles.slice(0, 5).map(article => ({
//             title: article.title,
//             description: article.description || "No description available.",
//             url: article.url,
//             source: article.source.name,
//             publishedAt: new Date(article.publishedAt).toLocaleString()
//         }));
//     } catch (error) {
//         console.error("❌ Error fetching news:", error.message);
//         return [];
//     }
// }

// // // Route to render elderly health news page (India & Kerala only)
// router.get("/elderly-news", async (req, res) => {
//     const elderlyNews = await fetchElderlyNews();
//     console.log("🔎 Sending Indian & Kerala elderly health news to template:", elderlyNews);
//     res.render("elderly-news", { articles: elderlyNews });
// });




//health related***********************************************



// async function fetchHealthcareNews() {
//     try {
//         const apiKey = process.env.NEWS_API_KEY; // Use environment variable
//         if (!apiKey) throw new Error("API key is missing! Set it in Render.");

//         const url = `https://newsapi.org/v2/everything?q=healthcare OR medical OR hospital OR disease OR treatment OR wellness&language=en&sortBy=publishedAt&apiKey=${apiKey}`;

//         const response = await axios.get(url);
//         let articles = response.data.articles || [];

//         if (articles.length === 0) {
//             console.warn("⚠️ No healthcare news found!");
//             return [];
//         }

//         const indianSources = new Set([
//             "The Times of India", "Hindustan Times", "NDTV", "The Hindu",
//             "Indian Express", "India Today", "Deccan Herald", "The Quint",
//             "Scroll.in", "Mathrubhumi", "Malayala Manorama", "The New Indian Express Kerala"
//         ]);

//         articles = articles.filter(article => article.source?.name && indianSources.has(article.source.name));

//         return articles.slice(0, 5).map(article => ({
//             title: article.title,
//             description: article.description || "No description available.",
//             url: article.url,
//             source: article.source.name,
//             publishedAt: new Date(article.publishedAt).toLocaleString()
//         }));

//     } catch (error) {
//         console.error("❌ Error fetching news:", error.message);
//         return [];
//     }
// }

// // Express Route for Elderly News Page
// router.get("/elderly-news", async (req, res) => {
//     try {
//         const healthcareNews = await fetchHealthcareNews();
//         res.render("elderly-news", { articles: healthcareNews });
//     } catch (error) {
//         console.error("❌ Error rendering page:", error.message);
//         res.render("elderly-news", { articles: [] });
//     }
// });


// async function fetchHealthcareNews() {
//     try {
//         const apiKey = process.env.NEWS_API_KEY; // Use environment variable
//         if (!apiKey) {
//             console.error("API key is missing! Set it in Render.");
//             throw new Error("API key is missing! Set it in Render.");
//         }

//         // Encode the query to avoid issues with spaces and operators
//         const query = encodeURIComponent("healthcare OR medical OR hospital OR disease OR treatment OR wellness");
//         const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
        
//         console.log("Fetching news from URL:", url);

//         const response = await axios.get(url);
//         let articles = response.data.articles || [];

//         if (articles.length === 0) {
//             console.warn("⚠️ No healthcare news found!");
//             return [];
//         }

//         const indianSources = new Set([
//             "The Times of India", "Hindustan Times", "NDTV", "The Hindu",
//             "Indian Express", "India Today", "Deccan Herald", "The Quint",
//             "Scroll.in", "Mathrubhumi", "Malayala Manorama", "The New Indian Express Kerala"
//         ]);

//         // Filter for Indian news sources
//         articles = articles.filter(article => article.source?.name && indianSources.has(article.source.name));

//         return articles.slice(0, 5).map(article => ({
//             title: article.title,
//             description: article.description || "No description available.",
//             url: article.url,
//             source: article.source.name,
//             publishedAt: new Date(article.publishedAt).toLocaleString()
//         }));

//     } catch (error) {
//         console.error("❌ Error fetching news:", error.message);
//         return [];
//     }
// }
// router.get("/elderly-news", async (req, res) => {
//         try {
//             const healthcareNews = await fetchHealthcareNews();
//             res.render("elderly-news", { articles: healthcareNews });
//         } catch (error) {
//             console.error("❌ Error rendering page:", error.message);
//             res.render("elderly-news", { articles: [] });
//         }
//     });























// ****************************************************************
// // ✅ Declare environment variables FIRST
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// // ✅ Check if credentials are properly loaded
// if (!accountSid || !authToken || !twilioPhoneNumber) {
//   console.error("Twilio credentials are missing! Check your .env file.");
//   process.exit(1); // Stop execution if credentials are missing
// }

// // ✅ Initialize the Twilio client AFTER variables are declared
// const client = twilio(accountSid, authToken);

// // Function to make an emergency call
// async function makeEmergencyCall() {
//   try {
//     const call = await client.calls.create({
//       twiml: "<Response><Say voice='alice'>hai adheena please call adith vijayan.</Say></Response>",
//       to: "+916282085045", // Ensure it's in E.164 format
//       from: twilioPhoneNumber, // Your Twilio phone number
//     });

//     console.log(`Call initiated successfully! Call SID: ${call.sid}`);
//     return { sid: call.sid, status: "in-progress" };
//   } catch (error) {
//     console.error("Error making emergency call:", error.message);
//     throw error;
//   }
// }

// // Express route for making the emergency call
// router.post('/emergency-call', async (req, res) => {
//   try {
//     const call = await makeEmergencyCall();
//     res.json({ 
//       success: true, 
//       callSid: call.sid, 
//       message: "Emergency call initiated."
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error making emergency call." });
//   }
// });




//gg function *********************************************************************************************************************************

router.get('/institution', (req, res) => {
    res.render('institution', { title: 'Express' });
});
router.post('/institution', async (req, res) => {
    req.body.role = 'institution'; 
    await userHelpers.doInstitution(req.body);
    res.redirect('/institutionhome');
});


router.get('/institutionhome', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
      userId = req.session.user._id;
      const dashboardStats = await userHelpers.getDashboardStats(userId);
      const unreadNotificationCount = await userHelpers.getUnreadNotificationCount(req.session.user._id);
      res.render('institutionhome', {
        user: req.session.user,
        institutionName: req.session.user.fullName,
        institutionId: req.session.user._id.toString(),
        dashboardStats,
        unreadNotificationCount,
        totalVolunteers: dashboardStats.totalVolunteers || 0, // Add this line
        appName: "Time Bank"
      });
      console.log(dashboardStats);
    } catch (error) {
      console.error('Error rendering institution home:', error);
      res.status(500).send('An error occurred while loading the dashboard');
    }
  });





module.exports = router;
