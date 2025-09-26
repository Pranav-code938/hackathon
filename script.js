// API Configuration
const BREED_API_URL = "https://serverless.roboflow.com";
const BREED_API_KEY = "bxfNUAG0fFZGcEggBdve";
const AGE_API_KEY = "uzkuNWY0Fg8F6oMZzaX9";
const OFFLINE_STORAGE_KEY = "offlineRecords";
const ONLINE_DATA_KEY = "onlineSyncData"; // Used to simulate external database data

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Global Variables
let currentAction = '';
let currentLanguage = 'en';
let stream = null;
let isVideoMode = false;
let recognition = null;
let isListening = false;
let lastResults = null;
let currentPrediction = null; // Stores the last AI prediction for form autofill

// Language translations
const translations = {
    en: {
        app_title: "Cattle Assessment",
        welcome: "Welcome to Cattle Assessment Tool",
        subtitle: "Choose an assessment type for your cattle",
        breed_recognition: "Cattle Breed Recognition",
        breed_desc: "Identify cattle breed from photo",
        health_assessment: "Cattle Health Check",
        health_desc: "Evaluate cattle health condition",
        age_estimation: "Cattle Age Estimation",
        age_desc: "Estimate cattle age from photo",
        instructions: "Instructions",
        tap_to_capture: "Tap to capture or upload photo",
        take_photo: "Take Photo",
        upload_photo: "Upload Photo",
        results: "Prediction Results",
        new_assessment: "New Assessment",
        analyzing: "Analyzing cattle image...",
        breed_title: "Cattle Breed Recognition",
        health_title: "Cattle Health Assessment",
        age_title: "Cattle Age Estimation",
        save_record: "Save Assessment Record",
        save_record_btn: "Confirm & Save Record",
        record_form_title: "New Assessment Record",
        data_log_title: "Assessment Data Log (BPA Style)",
        offline_message: "⚠️ Offline Mode: Records will sync when online.",
        sync_success: "✅ Offline records synced successfully!",
        ok: "OK",
        voice_commands_title: "Voice Commands",
        voice_cmd_breed: "\"Breed\" or \"नस्ल\" to start breed assessment.",
        voice_cmd_health: "\"Health\" or \"स्वास्थ्य\" to start health check.",
        voice_cmd_age: "\"Age\" or \"आयु\" to start age estimation.",
        voice_cmd_analyze: "\"Analyze\" or \"विश्लेषण\" to process the image.",
        voice_cmd_back: "\"Back\" or \"वापस\" to go back."
    },
    hi: {
        app_title: "पशु मूल्यांकन",
        welcome: "पशु मूल्यांकन उपकरण में आपका स्वागत है",
        subtitle: "अपने पशुओं के लिए एक मूल्यांकन प्रकार चुनें",
        breed_recognition: "पशु नस्ल की पहचान",
        breed_desc: "फोटो से पशु की नस्ल की पहचान करें",
        health_assessment: "पशु स्वास्थ्य जांच",
        health_desc: "पशु की स्वास्थ्य स्थिति का मूल्यांकन करें",
        age_estimation: "पशु आयु अनुमान",
        age_desc: "फोटो से पशु की आयु का अनुमान लगाएं",
        instructions: "निर्देश",
        tap_to_capture: "फोटो खींचने या अपलोड करने के लिए टैप करें",
        take_photo: "फोटो लें",
        upload_photo: "फोटो अपलोड करें",
        results: "भविष्यवाणी परिणाम",
        new_assessment: "नया मूल्यांकन",
        analyzing: "पशु की तस्वीर का विश्लेषण कर रहे हैं...",
        breed_title: "पशु नस्ल की पहचान",
        health_title: "पशु स्वास्थ्य मूल्यांकन",
        age_title: "पशु आयु अनुमान",
        save_record: "मूल्यांकन रिकॉर्ड सहेजें",
        save_record_btn: "पुष्टि करें और रिकॉर्ड सहेजें",
        record_form_title: "नया मूल्यांकन रिकॉर्ड",
        data_log_title: "मूल्यांकन डेटा लॉग (बीपीए शैली)",
        offline_message: "⚠️ ऑफलाइन मोड: ऑनलाइन होने पर रिकॉर्ड सिंक हो जाएंगे।",
        sync_success: "✅ ऑफलाइन रिकॉर्ड सफलतापूर्वक सिंक किए गए!",
        ok: "ठीक है",
        voice_commands_title: "वॉयस कमांड",
        voice_cmd_breed: "\"नस्ल\" या \"Breed\" बोलकर नस्ल मूल्यांकन शुरू करें।",
        voice_cmd_health: "\"स्वास्थ्य\" या \"Health\" बोलकर स्वास्थ्य जांच शुरू करें।",
        voice_cmd_age: "\"आयु\" या \"Age\" बोलकर आयु अनुमान शुरू करें।",
        voice_cmd_analyze: "\"विश्लेषण\" या \"Analyze\" बोलकर छवि को प्रोसेस करें।",
        voice_cmd_back: "\"वापस\" या \"Back\" बोलकर वापस जाएं।"
    }
};

// Instructions for each assessment type (unchanged)
const instructions = {
    breed: {
        en: [
            "Ensure good lighting and clear visibility of the cattle",
            "Capture the full body of the cattle if possible",
            "Focus on distinctive features like coat pattern and body structure",
            "Make sure the cattle is the main subject in the photo"
        ],
        hi: [
            "अच्छी रोशनी और पशु की स्पष्ट दृश्यता सुनिश्चित करें",
            "यदि संभव हो तो पशु का पूरा शरीर कैप्चर करें",
            "कोट पैटर्न और शरीर की संरचना जैसी विशिष्ट विशेषताओं पर ध्यान दें",
            "सुनिश्चित करें कि पशु फोटो में मुख्य विषय है"
        ]
    },
    health: {
        en: [
            "Focus on the cattle's eyes, nose, and mouth area",
            "Capture any visible skin conditions or injuries",
            "Include the overall body posture and stance",
            "Take clear photos showing the cattle's general condition"
        ],
        hi: [
            "पशु की आंखों, नाक और मुंह के क्षेत्र पर ध्यान दें",
            "किसी भी दिखाई देने वाली त्वचा की स्थिति या चोटों को कैप्चर करें",
            "समग्र शरीर की मुद्रा और स्थिति शामिल करें",
            "पशु की सामान्य स्थिति दिखाने वाली स्पष्ट तस्वीरें लें"
        ]
    },
    age: {
        en: [
            "Focus on the cattle's teeth and dental structure if visible",
            "Capture the overall body condition and muscle development",
            "Include facial features and horn development (if present)",
            "Show the cattle's size relative to surroundings"
        ],
        hi: [
            "यदि दिखाई दे तो पशु के दांतों और दंत संरचना पर ध्यान दें",
            "समग्र शरीर की स्थिति और मांसपेशियों के विकास को कैप्चर करें",
            "चेहरे की विशेषताओं और सींग के विकास को शामिल करें (यदि मौजूद हो)",
            "आसपास के वातावरण के सापेक्ष पशु का आकार दिखाएं"
        ]
    }
};

// --- Core Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', function() {
    initializeLanguageModal();
    setupEventListeners();
    initializeSpeechRecognition();
    
    // Setup network listeners
    window.addEventListener("online", syncOfflineRecords);
    window.addEventListener("offline", showOfflineStatus);

    // Initial load checks
    loadAndRenderTable();
    checkNetworkStatus();
});

// --- Network & Storage Logic ---

function checkNetworkStatus() {
    if (!navigator.onLine) {
        showOfflineStatus();
    }
}

function showOfflineStatus() {
    const banner = document.getElementById('statusBanner');
    banner.textContent = translations[currentLanguage]['offline_message'] || translations['en']['offline_message'];
    banner.className = 'status-banner offline';
    banner.style.display = 'block';
}

function showCustomAlert(title, message, isSuccess = false) {
    const modal = document.getElementById('customAlert');
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    
    const titleElement = document.getElementById('alertTitle');
    titleElement.style.color = isSuccess ? '#28a745' : '#dc3545';

    modal.classList.add('active');
}

function getOfflineRecords() {
    try {
        const recordsJson = localStorage.getItem(OFFLINE_STORAGE_KEY);
        return recordsJson ? JSON.parse(recordsJson) : [];
    } catch (e) {
        console.error("Error retrieving offline records:", e);
        return [];
    }
}

function saveToOfflineStorage(record) {
    const records = getOfflineRecords();
    records.push(record);
    try {
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
        console.error("Error saving record to localStorage:", e);
    }
}

function simulateOnlineSync(record) {
    // In a real app, this would be an API POST request (e.g., to a BPA endpoint).
    console.log("SIMULATING ONLINE SYNC/POST to API:", record);
    
    // Simulate updating the 'online' data store for the table
    const onlineData = JSON.parse(localStorage.getItem(ONLINE_DATA_KEY) || '[]');
    onlineData.push(record);
    localStorage.setItem(ONLINE_DATA_KEY, JSON.stringify(onlineData));
}

function syncOfflineRecords() {
    const offlineRecords = getOfflineRecords();
    
    if (offlineRecords.length === 0) {
        document.getElementById('statusBanner').style.display = 'none';
        return;
    }

    // 1. Sync (Simulated)
    console.log(`SYNCING ${offlineRecords.length} OFFLINE RECORDS:`);
    offlineRecords.forEach(record => {
        simulateOnlineSync(record); // Move to simulated online store
    });

    // 2. Clear localStorage
    localStorage.removeItem(OFFLINE_STORAGE_KEY);

    // 3. Update UI
    loadAndRenderTable();
    
    // 4. Show success message
    const banner = document.getElementById('statusBanner');
    banner.textContent = translations[currentLanguage]['sync_success'] || translations['en']['sync_success'];
    banner.className = 'status-banner online-success';
    banner.style.display = 'block';

    setTimeout(() => {
        banner.style.display = 'none';
    }, 5000);
}


// --- Record Form Logic ---

function showRecordForm() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('recordFormSection').style.display = 'block';
    
    // Auto-fill fields if prediction data exists
    if (currentPrediction) {
        document.getElementById('predictedBreed').value = currentPrediction.breed;
        document.getElementById('confidence').value = currentPrediction.confidence;
    }

    // Scroll to the form
    document.getElementById('recordFormSection').scrollIntoView({ behavior: 'smooth' });
}

function resetRecordForm() {
    document.getElementById('cattleRecordForm').reset();
    document.getElementById('recordFormSection').style.display = 'none';
    currentPrediction = null;
}

function saveRecord() {
    const form = document.getElementById('cattleRecordForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const newRecord = {
        id: document.getElementById('animalId').value,
        breed: document.getElementById('predictedBreed').value,
        confidence: document.getElementById('confidence').value,
        ageCategory: document.getElementById('ageCategory').value,
        healthStatus: document.getElementById('healthStatus').value,
        flwId: document.getElementById('flwId').value,
        timestamp: new Date().toISOString()
    };

    if (navigator.onLine) {
        simulateOnlineSync(newRecord);
        showCustomAlert("Success", "Record saved and synced immediately!", true);
    } else {
        saveToOfflineStorage(newRecord);
        showCustomAlert("Offline Save", "Record saved locally. Sync will occur when online.", false);
        showOfflineStatus();
    }

    resetRecordForm();
    loadAndRenderTable(); // Refresh table immediately
}


// --- Table Rendering Logic ---

function loadAndRenderTable() {
    const offlineRecords = getOfflineRecords();
    const onlineRecords = JSON.parse(localStorage.getItem(ONLINE_DATA_KEY) || '[]');
    const allRecords = onlineRecords.concat(offlineRecords).reverse(); // Show newest first
    const tbody = document.getElementById('recordsTableBody');
    tbody.innerHTML = '';
    
    if (allRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999;">No records found.</td></tr>`;
        return;
    }

    allRecords.forEach(record => {
        const row = tbody.insertRow();
        
        // Add a class for offline records to potentially style them differently
        if (!navigator.onLine && offlineRecords.includes(record)) {
            row.style.backgroundColor = '#ffdddd'; // Light red for unsynced offline records
        }

        const date = new Date(record.timestamp);
        const timeString = date.toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit' });

        const cells = [
            record.id,
            record.breed,
            `${record.confidence}%`,
            record.ageCategory,
            record.healthStatus,
            record.flwId,
            timeString
        ];

        cells.forEach(text => {
            const cell = row.insertCell();
            cell.textContent = text;
        });
    });
}


// --- Existing App Functions (Modified for Integration) ---

function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultCard = document.getElementById('resultCard');
    const speakBtn = document.getElementById('speakBtn');
    
    // Store prediction globally for form autofill
    currentPrediction = {
        breed: result.predictions[0].class,
        confidence: result.predictions[0].confidence
    };
    
    let resultHTML = '';
    // ... (rest of the result display logic remains the same)
    
    if (result.type === 'breed') {
        resultHTML = `
            <div class="result-item">
                <span class="result-label">Top Breed:</span>
                <span class="result-value">${result.predictions[0].class}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence:</span>
                <span class="result-value">${result.predictions[0].confidence}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${result.predictions[0].confidence}%"></div>
            </div>
        `;
        
        if (result.predictions.length > 1) {
            resultHTML += '<div style="margin-top: 1rem;"><strong>Other possibilities:</strong></div>';
            result.predictions.slice(1, 3).forEach(pred => {
                resultHTML += `
                    <div class="result-item">
                        <span class="result-label">${pred.class}:</span>
                        <span class="result-value">${pred.confidence}%</span>
                    </div>
                `;
            });
        }
    } else if (result.type === 'health') {
        // Mock health prediction for autofill structure compliance
        currentPrediction = {
            breed: result.condition,
            confidence: result.score
        };
        
        resultHTML = `
            <div class="result-item">
                <span class="result-label">Overall Health:</span>
                <span class="result-value">${result.condition}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Health Score:</span>
                <span class="result-value">${result.score}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${result.score}%"></div>
            </div>
            <div style="margin-top: 1rem;"><strong>Observations:</strong></div>
        `;
        
        result.symptoms.forEach(symptom => {
            resultHTML += `<div style="padding: 0.3rem 0; color: #555;">• ${symptom}</div>`;
        });
    } else if (result.type === 'age') {
         // Mock age prediction for autofill structure compliance
        currentPrediction = {
            breed: `${result.years}yr ${result.months}mo`,
            confidence: result.confidence
        };

        resultHTML = `
            <div class="result-item">
                <span class="result-label">Estimated Age:</span>
                <span class="result-value">${result.years} years ${result.months} months</span>
            </div>
            <div class="result-item">
                <span class="result-label">Category:</span>
                <span class="result-value">${result.category}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence:</span>
                <span class="result-value">${result.confidence}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${result.confidence}%"></div>
            </div>
            <div style="margin-top: 1rem;"><strong>Age indicators:</strong></div>
        `;
        
        result.indicators.forEach(indicator => {
            resultHTML += `<div style="padding: 0.3rem 0; color: #555;">• ${indicator}</div>`;
        });
    }
    
    resultCard.innerHTML = resultHTML;
    resultsSection.style.display = 'block';
    speakBtn.style.display = 'block';
    
    // Animate confidence bars
    setTimeout(() => {
        const fills = document.querySelectorAll('.confidence-fill');
        fills.forEach(fill => {
            fill.style.width = fill.style.width;
        });
    }, 100);
}


function hideResults() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('speakBtn').style.display = 'none';
}

function resetAssessmentScreen() {
    resetCamera();
    hideResults();
    hideLoading();
    resetRecordForm(); // Reset the new form
    lastResults = null;
    currentPrediction = null;
    
    // Clear file input
    document.getElementById('fileInput').value = '';
}


// --- Unchanged Functions ---

function initializeSpeechRecognition() {
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'en' ? 'en-US' : `${currentLanguage}-IN`;
        
        recognition.onstart = function() {
            isListening = true;
            document.getElementById('voiceToggle').classList.add('listening');
            console.log("Listening for commands...");
        };

        recognition.onresult = function(event) {
            const command = event.results[0][0].transcript.toLowerCase();
            handleVoiceCommand(command);
        };
        
        recognition.onerror = function(event) {
            isListening = false;
            document.getElementById('voiceToggle').classList.remove('listening');
            console.error('Speech Recognition Error:', event.error);
        };
        
        recognition.onend = function() {
            isListening = false;
            document.getElementById('voiceToggle').classList.remove('listening');
            console.log("Listening stopped.");
        };
    } else {
        console.warn('Web Speech API not supported on this device.');
        document.getElementById('voiceToggle').style.display = 'none'; 
    }
}

function toggleVoiceCommandsPopup() {
    const popup = document.getElementById('voiceCommandsPopup');
    popup.classList.toggle('active');
    updateTexts(); 
}

function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileSelect);

    const helpBtn = document.getElementById('helpBtn');
    helpBtn.addEventListener('click', toggleVoiceCommandsPopup);

    document.getElementById('languageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLanguageModal();
        }
    });

    document.addEventListener('click', function(e) {
        const popup = document.getElementById('voiceCommandsPopup');
        if (popup.classList.contains('active') && !popup.contains(e.target) && e.target.id !== 'helpBtn' && !e.target.closest('.help-btn')) {
            popup.classList.remove('active');
        }
    });
}

function toggleVoiceInput() {
    if (isListening) {
        if (recognition) {
            recognition.stop();
        }
    } else {
        if (recognition) {
            recognition.start();
        }
    }
}
function speakResults() { /* ... unchanged ... */ } // Logic remains as per last update
function updateTexts() { /* ... unchanged ... */ } // Logic remains as per last update
function handleVoiceCommand(command) { /* ... unchanged ... */ } // Logic remains as per last update
function selectAction(action) { /* ... unchanged ... */ } // Logic remains as per last update
function showAssessmentScreen() { /* ... unchanged ... */ } // Logic remains as per last update
function goBack() { /* ... unchanged ... */ } // Logic remains as per last update
function setupAssessmentScreen() { /* ... unchanged ... */ } // Logic remains as per last update
function resetCamera() { /* ... unchanged ... */ } // Logic remains as per last update
function openCamera() { /* ... unchanged ... */ } // Logic remains as per last update
function capturePhoto() { /* ... unchanged ... */ } // Logic remains as per last update
function uploadPhoto() { /* ... unchanged ... */ } // Logic remains as per last update
function handleFileSelect(event) { /* ... unchanged ... */ } // Logic remains as per last update
function displayImage(file) { /* ... unchanged ... */ } // Logic remains as per last update
function processCurrentImage() { /* ... unchanged ... */ } // Logic remains as per last update
async function processImage(imageFile) { /* ... unchanged ... */ } // Logic remains as per last update
async function processBreedRecognition(imageFile) { /* ... unchanged ... */ } // Logic remains as per last update
async function processAgeEstimation(imageFile) { /* ... unchanged ... */ } // Logic remains as per last update
function generateHealthResults() { /* ... unchanged ... */ } // Logic remains as per last update
function showLoading() { /* ... unchanged ... */ } // Logic remains as per last update
function hideLoading() { /* ... unchanged ... */ } // Logic remains as per last update
function newAssessment() { /* ... unchanged ... */ } // Logic remains as per last update

// Re-using simplified toggleListening function
function toggleListening() {
    if (isListening) {
        if (recognition) {
            recognition.stop();
        }
    } else {
        if (recognition) {
            // Re-initialize language setting just before starting
            recognition.lang = currentLanguage === 'en' ? 'en-US' : `${currentLanguage}-IN`;
            recognition.start();
        }
    }
}
