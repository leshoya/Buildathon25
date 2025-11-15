// Interview configuration
const interviewConfigs = {
    'tech-google': {
        name: 'Sarah from Google',
        personality: 'friendly',
        style: 'conversational',
        questions: [
            'Tell me about yourself and why you\'re interested in this role.',
            'Can you walk me through a challenging technical problem you\'ve solved?',
            'How do you approach working in a team environment?',
            'What\'s your experience with large-scale systems?',
            'Where do you see yourself in 5 years?'
        ]
    },
    'tech-microsoft': {
        name: 'David from Microsoft',
        personality: 'professional',
        style: 'structured',
        questions: [
            'Please introduce yourself and your background.',
            'Describe a time when you had to learn a new technology quickly.',
            'How do you handle conflicting priorities in a project?',
            'Can you explain a complex technical concept to a non-technical audience?',
            'What motivates you in your career?'
        ]
    },
    'tech-apple': {
        name: 'Emma from Apple',
        personality: 'creative',
        style: 'innovative',
        questions: [
            'What draws you to our company and products?',
            'Tell me about a creative solution you\'ve implemented.',
            'How do you balance innovation with practicality?',
            'Describe a project where attention to detail was critical.',
            'What does great design mean to you?'
        ]
    },
    'finance-goldman': {
        name: 'James from Goldman Sachs',
        personality: 'analytical',
        style: 'precise',
        questions: [
            'Walk me through your background and relevant experience.',
            'How do you analyze complex financial data?',
            'Describe a time you made a data-driven decision under pressure.',
            'What\'s your approach to risk assessment?',
            'How do you stay current with market trends?'
        ]
    },
    'finance-mckinsey': {
        name: 'Lisa from McKinsey',
        personality: 'strategic',
        style: 'consultative',
        questions: [
            'Tell me about yourself and your problem-solving approach.',
            'Can you walk me through how you would approach a new business challenge?',
            'Describe a time you influenced a decision without authority.',
            'How do you break down complex problems?',
            'What\'s your framework for making strategic recommendations?'
        ]
    },
    'startup': {
        name: 'Alex from Startup',
        personality: 'casual',
        style: 'fast-paced',
        questions: [
            'Hey! Tell me a bit about yourself.',
            'How do you handle ambiguity and rapid change?',
            'What\'s your experience with wearing multiple hats?',
            'Can you give an example of when you had to move fast?',
            'Why are you interested in joining a startup?'
        ]
    },
    'corporate': {
        name: 'Robert from Corporate',
        personality: 'formal',
        style: 'traditional',
        questions: [
            'Good morning. Please introduce yourself.',
            'What are your key strengths and how do they apply to this role?',
            'Describe your leadership style.',
            'How do you handle workplace conflicts?',
            'What are your long-term career goals?'
        ]
    },
    'creative-agency': {
        name: 'Maya from Creative Agency',
        personality: 'energetic',
        style: 'dynamic',
        questions: [
            'Hi! I\'d love to hear about your creative journey.',
            'Show me a project you\'re really proud of and why.',
            'How do you handle creative feedback and revisions?',
            'What inspires your work?',
            'How do you stay creative under tight deadlines?'
        ]
    }
};

// Interview state
let currentInterview = null;
let currentQuestionIndex = 0;
let userResponses = [];
let interviewStartTime = null;
let responseTimes = [];
let questionStartTimes = []; // Track when each question was asked
let recognition = null;
let synthesis = window.speechSynthesis;
let userStream = null;
let isMicOn = true;
let isCameraOn = true;
let timerInterval = null;

// Initialize speech recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleUserResponse(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            updateStatus('Error: ' + event.error);
            stopListening();
        };
        
        recognition.onend = () => {
            stopListening();
        };
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    
    document.getElementById('start-interview-btn').addEventListener('click', startInterview);
    document.getElementById('end-interview-btn').addEventListener('click', endInterview);
    document.getElementById('listen-btn').addEventListener('click', toggleListening);
    document.getElementById('mic-btn').addEventListener('click', toggleMic);
    document.getElementById('camera-btn').addEventListener('click', toggleCamera);
    document.getElementById('new-interview-btn').addEventListener('click', () => {
        showPage('landing-page');
        stopCamera();
    });
});

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Start interview
async function startInterview() {
    const companySelect = document.getElementById('company-select').value;
    const positionSelect = document.getElementById('position-select').value;
    const difficultySelect = document.getElementById('difficulty-select').value;
    const lengthSelect = document.getElementById('length-select').value;
    
    const baseConfig = interviewConfigs[companySelect];
    
    // Adjust questions based on length
    let questions = [...baseConfig.questions];
    const lengthMap = {
        'short': 3,
        'medium': 5,
        'long': 8
    };
    
    const targetQuestions = lengthMap[lengthSelect];
    if (questions.length < targetQuestions) {
        // Repeat questions if needed
        while (questions.length < targetQuestions) {
            questions = questions.concat([...baseConfig.questions]);
        }
    }
    questions = questions.slice(0, targetQuestions);
    
    currentInterview = {
        ...baseConfig,
        questions: questions,
        position: positionSelect,
        difficulty: difficultySelect,
        length: lengthSelect
    };
    
    currentQuestionIndex = 0;
    userResponses = [];
    responseTimes = [];
    questionStartTimes = [];
    interviewStartTime = Date.now();
    
    // Update UI
    document.getElementById('interviewer-name-display').textContent = currentInterview.name;
    document.getElementById('total-questions').textContent = currentInterview.questions.length;
    
    showPage('interview-page');
    
    // Start camera (with error handling)
    const cameraStarted = await startCamera();
    
    // If camera failed and we can't continue, show error and return to landing
    if (!cameraStarted && !userStream) {
        // Check if we can continue with audio only
        setTimeout(async () => {
            if (!userStream) {
                const continueAnyway = confirm('Camera/microphone access is required for the interview. Would you like to try again?');
                if (!continueAnyway) {
                    showPage('landing-page');
                } else {
                    await startCamera();
                }
            }
        }, 2000);
        return;
    }
    
    // Start timer
    startTimer();
    
    // Start with greeting
    setTimeout(() => {
        askQuestion(0);
    }, 1000);
}

// Check media permissions
async function checkMediaPermissions() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
            supported: false,
            video: false,
            audio: false,
            error: 'Media devices API not supported. Please use a modern browser like Chrome or Edge.'
        };
    }

    try {
        // Check permission state if available
        if (navigator.permissions && navigator.permissions.query) {
            const videoPermission = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
            const audioPermission = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            
            return {
                supported: true,
                video: videoPermission ? videoPermission.state : 'unknown',
                audio: audioPermission ? audioPermission.state : 'unknown'
            };
        }
        return { supported: true, video: 'unknown', audio: 'unknown' };
    } catch (error) {
        return { supported: true, video: 'unknown', audio: 'unknown' };
    }
}

// Start camera with better error handling
async function startCamera() {
    // Check if media devices are supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showPermissionError('Your browser does not support camera/microphone access. Please use Chrome, Edge, or Firefox.');
        return false;
    }

    // Show loading state
    const placeholder = document.getElementById('video-placeholder');
    placeholder.innerHTML = '<div class="placeholder-icon">⏳</div><div class="placeholder-text">Requesting permissions...</div>';

    try {
        // Request permissions with specific constraints
        userStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }, 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        const userVideo = document.getElementById('user-video');
        userVideo.srcObject = userStream;
        
        // Handle video errors
        userVideo.onerror = (error) => {
            console.error('Video playback error:', error);
            showPermissionError('Video playback error. Please check your camera settings.', true);
        };
        
        // Wait for video to be ready
        userVideo.onloadedmetadata = () => {
            try {
                userVideo.play().catch(error => {
                    console.error('Error playing video:', error);
                    // Video might still work, just log the error
                });
                placeholder.classList.add('hidden');
                isCameraOn = true;
                isMicOn = true;
                updateControlButtons();
            } catch (error) {
                console.error('Error setting up video:', error);
            }
        };

        return true;
    } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        handleMediaError(error);
        return false;
    }
}

// Handle media access errors
function handleMediaError(error) {
    let errorMessage = '';
    let canContinue = false;

    switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
            errorMessage = 'Camera and microphone permissions were denied. Please allow access in your browser settings and refresh the page.';
            canContinue = false;
            break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
            errorMessage = 'No camera or microphone found. You can continue without video, but microphone is required for the interview.';
            canContinue = true;
            // Try to get just audio
            requestAudioOnly();
            break;
        case 'NotReadableError':
        case 'TrackStartError':
            errorMessage = 'Camera or microphone is being used by another application. Please close other apps and try again.';
            canContinue = false;
            break;
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
            errorMessage = 'Camera settings not supported. Trying with basic settings...';
            canContinue = true;
            // Try with basic constraints
            requestBasicMedia();
            break;
        case 'NotSupportedError':
            errorMessage = 'Your browser does not support camera/microphone access. Please use Chrome, Edge, or Firefox.';
            canContinue = false;
            break;
        case 'AbortError':
            errorMessage = 'Permission request was aborted. Please try again.';
            canContinue = true;
            break;
        default:
            errorMessage = `Unable to access camera/microphone: ${error.message || error.name}. Please check your browser settings.`;
            canContinue = true;
    }

    showPermissionError(errorMessage, canContinue);
}

// Request audio only as fallback (global for onclick)
window.requestAudioOnly = async function() {
    try {
        userStream = await navigator.mediaDevices.getUserMedia({ 
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        const placeholder = document.getElementById('video-placeholder');
        placeholder.innerHTML = '<div class="placeholder-icon">🎤</div><div class="placeholder-text">Audio Only Mode</div>';
        placeholder.classList.remove('hidden');
        isCameraOn = false;
        isMicOn = true;
        updateControlButtons();
    } catch (error) {
        console.error('Error accessing audio only:', error);
        showPermissionError('Could not access microphone. Microphone is required for the interview.', false);
    }
};

// Request basic media constraints
async function requestBasicMedia() {
    try {
        userStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: true
        });
        const userVideo = document.getElementById('user-video');
        userVideo.srcObject = userStream;
        document.getElementById('video-placeholder').classList.add('hidden');
        isCameraOn = true;
        isMicOn = true;
        updateControlButtons();
    } catch (error) {
        console.error('Error with basic media:', error);
        handleMediaError(error);
    }
}

// Show permission error with option to continue
function showPermissionError(message, canContinue = false) {
    const placeholder = document.getElementById('video-placeholder');
    const buttonHtml = canContinue ? 
        '<br><br><button id="audio-only-btn" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Continue with Audio Only</button>' : 
        '<br><br><button id="retry-permissions-btn" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Retry</button>';
    
    placeholder.innerHTML = `
        <div class="placeholder-icon">⚠️</div>
        <div class="placeholder-text" style="max-width: 300px; text-align: center; padding: 10px; font-size: 14px; line-height: 1.5;">
            ${message}
            ${buttonHtml}
        </div>
    `;
    placeholder.classList.remove('hidden');
    
    // Add event listeners for buttons
    const audioOnlyBtn = document.getElementById('audio-only-btn');
    if (audioOnlyBtn) {
        audioOnlyBtn.addEventListener('click', window.requestAudioOnly);
    }
    
    const retryBtn = document.getElementById('retry-permissions-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            startCamera();
        });
    }
}

// Update control button states
function updateControlButtons() {
    const micBtn = document.getElementById('mic-btn');
    const cameraBtn = document.getElementById('camera-btn');
    
    if (micBtn) {
        if (isMicOn && userStream && userStream.getAudioTracks().length > 0) {
            micBtn.classList.add('active');
            micBtn.querySelector('.control-icon').textContent = '🎤';
        } else {
            micBtn.classList.remove('active');
            micBtn.querySelector('.control-icon').textContent = '🔇';
        }
    }
    
    if (cameraBtn) {
        if (isCameraOn && userStream && userStream.getVideoTracks().length > 0) {
            cameraBtn.classList.add('active');
            cameraBtn.querySelector('.control-icon').textContent = '📹';
        } else {
            cameraBtn.classList.remove('active');
            cameraBtn.querySelector('.control-icon').textContent = '📷';
        }
    }
}

// Stop camera
function stopCamera() {
    if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        userStream = null;
    }
    const userVideo = document.getElementById('user-video');
    userVideo.srcObject = null;
    document.getElementById('video-placeholder').classList.remove('hidden');
}

// Toggle microphone
function toggleMic() {
    if (!userStream) {
        // Try to request audio if not available
        requestAudioOnly();
        return;
    }
    
    const audioTracks = userStream.getAudioTracks();
    if (audioTracks.length === 0) {
        // No audio tracks, try to get them
        requestAudioOnly();
        return;
    }
    
    isMicOn = !isMicOn;
    audioTracks.forEach(track => {
        track.enabled = isMicOn;
    });
    updateControlButtons();
}

// Toggle camera
function toggleCamera() {
    if (!userStream) {
        // Try to request video if not available
        startCamera();
        return;
    }
    
    const videoTracks = userStream.getVideoTracks();
    const placeholder = document.getElementById('video-placeholder');
    
    if (videoTracks.length === 0) {
        // No video tracks, try to get them
        startCamera();
        return;
    }
    
    isCameraOn = !isCameraOn;
    videoTracks.forEach(track => {
        track.enabled = isCameraOn;
    });
    
    if (isCameraOn) {
        placeholder.classList.add('hidden');
    } else {
        placeholder.innerHTML = '<div class="placeholder-icon">📷</div><div class="placeholder-text">Camera Off</div>';
        placeholder.classList.remove('hidden');
    }
    
    updateControlButtons();
}

// Start timer
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (interviewStartTime) {
            const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('interview-timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

// Ask question
function askQuestion(index) {
    if (index >= currentInterview.questions.length) {
        endInterview();
        return;
    }
    
    currentQuestionIndex = index;
    const question = currentInterview.questions[index];
    
    // Track when this question was asked (after speech ends)
    const questionAskedTime = Date.now();
    questionStartTimes[index] = questionAskedTime;
    
    // Update UI
    document.getElementById('interviewer-text').textContent = question;
    document.getElementById('interviewer-transcript').style.display = 'block';
    document.getElementById('user-transcript').style.display = 'none';
    document.getElementById('question-number').textContent = index + 1;
    document.getElementById('user-text').textContent = 'Your response will appear here...';
    document.getElementById('interviewer-status').textContent = 'Speaking...';
    
    // Update progress
    const progress = ((index + 1) / currentInterview.questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    
    // Animate AI avatar
    animateAvatarSpeaking();
    
    // Speak question and track when question actually starts (after speech)
    speakText(question);
    
    updateStatus('Ready to listen');
    document.getElementById('user-status').textContent = 'Ready';
}

// Handle user response
function handleUserResponse(transcript) {
    const currentTime = Date.now();
    const questionStartTime = questionStartTimes[currentQuestionIndex] || interviewStartTime;
    const responseDuration = currentTime - questionStartTime; // Time spent on this question
    
    // Store response time data
    responseTimes.push({
        questionIndex: currentQuestionIndex,
        startTime: questionStartTime,
        endTime: currentTime,
        duration: responseDuration
    });
    
    userResponses.push({
        question: currentInterview.questions[currentQuestionIndex],
        answer: transcript,
        time: currentTime - interviewStartTime,
        responseDuration: responseDuration
    });
    
    // Update UI
    document.getElementById('user-text').textContent = transcript;
    document.getElementById('user-transcript').style.display = 'block';
    document.getElementById('interviewer-transcript').style.display = 'none';
    document.getElementById('user-status').textContent = 'Speaking';
    document.getElementById('interviewer-status').textContent = 'Listening...';
    
    // Stop avatar animation
    stopAvatarSpeaking();
    
    // Move to next question after a delay
    setTimeout(() => {
        askQuestion(currentQuestionIndex + 1);
    }, 3000);
}

// Text to speech
function speakText(text) {
    if (synthesis.speaking) {
        synthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust voice based on personality
    const voices = synthesis.getVoices();
    if (voices.length > 0) {
        const personalityVoices = {
            'friendly': voices.find(v => v.name.includes('Zira')) || voices[0],
            'professional': voices.find(v => v.name.includes('David')) || voices[1] || voices[0],
            'creative': voices.find(v => v.name.includes('Zira')) || voices[0],
            'analytical': voices.find(v => v.name.includes('David')) || voices[1] || voices[0],
            'strategic': voices.find(v => v.name.includes('Zira')) || voices[0],
            'casual': voices.find(v => v.name.includes('Zira')) || voices[0],
            'formal': voices.find(v => v.name.includes('David')) || voices[1] || voices[0],
            'energetic': voices.find(v => v.name.includes('Zira')) || voices[0]
        };
        
        utterance.voice = personalityVoices[currentInterview.personality] || voices[0];
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
        animateAvatarSpeaking();
        document.getElementById('interviewer-status').textContent = 'Speaking...';
    };
    
    utterance.onend = () => {
        stopAvatarSpeaking();
        updateStatus('Ready to listen');
        document.getElementById('interviewer-status').textContent = 'Listening...';
        // Update question start time after speech ends
        if (questionStartTimes[currentQuestionIndex] === undefined) {
            questionStartTimes[currentQuestionIndex] = Date.now();
        }
    };
    
    synthesis.speak(utterance);
}

// Animate avatar when speaking
function animateAvatarSpeaking() {
    const mouth = document.querySelector('.ai-mouth');
    if (mouth) {
        mouth.style.animation = 'speak 0.5s infinite';
    }
}

// Stop avatar animation
function stopAvatarSpeaking() {
    const mouth = document.querySelector('.ai-mouth');
    if (mouth) {
        mouth.style.animation = 'none';
    }
}

// Toggle listening
function toggleListening() {
    if (!recognition) {
        alert('Speech recognition not available. Please use Chrome or Edge.');
        return;
    }
    
    if (recognition && recognition.state === 'listening') {
        stopListening();
    } else {
        startListening();
    }
}

// Start listening
function startListening() {
    if (recognition && recognition.state !== 'listening') {
        recognition.start();
        const listenBtn = document.getElementById('listen-btn');
        listenBtn.classList.add('listening');
        document.getElementById('listen-text').textContent = 'Listening...';
        document.getElementById('listen-icon').textContent = '🔴';
        document.getElementById('user-status').textContent = 'Speaking...';
        updateStatus('Listening...');
    }
}

// Stop listening
function stopListening() {
    if (recognition && recognition.state === 'listening') {
        recognition.stop();
    }
    const listenBtn = document.getElementById('listen-btn');
    listenBtn.classList.remove('listening');
    document.getElementById('listen-text').textContent = 'Speak';
    document.getElementById('listen-icon').textContent = '🎙️';
    document.getElementById('user-status').textContent = 'Ready';
}

// Update status (kept for compatibility, but status is now shown in video overlay)
function updateStatus(text) {
    // Status is now displayed in the video participant info
    if (document.getElementById('user-status')) {
        // Status updates are handled in individual functions
    }
}

// End interview
function endInterview() {
    if (synthesis.speaking) {
        synthesis.cancel();
    }
    stopListening();
    stopCamera();
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Generate feedback
    generateFeedback();
    
    showPage('feedback-page');
}

// Generate feedback
function generateFeedback() {
    // Calculate scores based on responses
    const totalQuestions = currentInterview.questions.length;
    const answeredQuestions = userResponses.length;
    const completionRate = (answeredQuestions / totalQuestions) * 100;
    
    if (answeredQuestions === 0) {
        // No responses - set minimum scores
        setScores(0, 0, 0, 0, 0);
        return;
    }
    
    // Analyze responses with better metrics
    const responses = userResponses.map((r, idx) => {
        const answer = r.answer.toLowerCase();
        const words = r.answer.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        const charCount = r.answer.length;
        const responseDuration = r.responseDuration || 0;
        
        // Quality indicators
        const hasExamples = /(example|instance|for example|such as|like when|case|scenario)/i.test(r.answer);
        const hasPersonalPronouns = /(i |we |my |our |me |us )/i.test(r.answer);
        const hasNumbers = /\d+/.test(r.answer);
        const hasActionWords = /(achieved|implemented|developed|created|improved|led|managed|designed|built|solved|delivered|accomplished|executed|established)/i.test(r.answer);
        const hasResults = /(result|outcome|impact|improvement|increase|decrease|success|achievement)/i.test(r.answer);
        const hasTimeframes = /(month|year|week|day|quarter|period|duration)/i.test(r.answer);
        
        // Calculate quality score for this response (0-100)
        let qualityScore = 0;
        
        // Length scoring (optimal: 50-200 words)
        if (wordCount >= 20 && wordCount <= 200) {
            qualityScore += 25;
        } else if (wordCount >= 10 && wordCount < 20) {
            qualityScore += 15;
        } else if (wordCount > 200) {
            qualityScore += 20; // Too long, but still gets points
        } else {
            qualityScore += Math.max(0, wordCount * 1.5); // Very short responses
        }
        
        // Content quality indicators
        if (hasExamples) qualityScore += 20;
        if (hasPersonalPronouns) qualityScore += 10;
        if (hasActionWords) qualityScore += 15;
        if (hasNumbers) qualityScore += 10;
        if (hasResults) qualityScore += 10;
        if (hasTimeframes) qualityScore += 5;
        
        // Response time scoring (optimal: 10-60 seconds per question)
        let timeScore = 0;
        const seconds = responseDuration / 1000;
        if (seconds >= 10 && seconds <= 60) {
            timeScore = 10; // Optimal response time
        } else if (seconds >= 5 && seconds < 10) {
            timeScore = 7; // Too quick
        } else if (seconds > 60 && seconds <= 120) {
            timeScore = 8; // A bit long
        } else if (seconds > 120) {
            timeScore = 5; // Too long
        } else {
            timeScore = 3; // Very quick
        }
        qualityScore += timeScore;
        
        return {
            wordCount,
            charCount,
            responseDuration,
            qualityScore: Math.min(100, qualityScore),
            hasExamples,
            hasNumbers,
            hasActionWords,
            hasResults,
            hasPersonalPronouns
        };
    });
    
    // Calculate aggregate metrics
    const avgWordCount = responses.reduce((sum, r) => sum + r.wordCount, 0) / answeredQuestions;
    const avgCharCount = responses.reduce((sum, r) => sum + r.charCount, 0) / answeredQuestions;
    const avgQualityScore = responses.reduce((sum, r) => sum + r.qualityScore, 0) / answeredQuestions;
    const avgResponseTime = responses.reduce((sum, r) => sum + (r.responseDuration / 1000), 0) / answeredQuestions;
    
    // Count quality indicators across all responses
    const totalExamples = responses.filter(r => r.hasExamples).length;
    const totalNumbers = responses.filter(r => r.hasNumbers).length;
    const totalActionWords = responses.filter(r => r.hasActionWords).length;
    const totalResults = responses.filter(r => r.hasResults).length;
    const totalPersonalPronouns = responses.filter(r => r.hasPersonalPronouns).length;
    
    // Calculate individual scores (0-100 scale)
    
    // Communication Score (40% completion, 30% length appropriateness, 30% clarity indicators)
    const communicationBase = completionRate * 0.4;
    const lengthScore = (avgWordCount >= 20 && avgWordCount <= 200) ? 30 : 
                       (avgWordCount >= 10 && avgWordCount < 20) ? 20 : 
                       (avgWordCount > 200) ? 25 : Math.min(30, avgWordCount * 1.5);
    const clarityScore = (totalPersonalPronouns / answeredQuestions) * 15 + 
                        (totalExamples / answeredQuestions) * 15;
    const communicationScore = Math.min(100, Math.max(0, communicationBase + lengthScore + clarityScore));
    
    // Relevance Score (50% completion, 30% response quality, 20% consistency)
    const relevanceBase = completionRate * 0.5;
    const qualityComponent = avgQualityScore * 0.3;
    const consistencyScore = (responses.filter(r => r.qualityScore >= 50).length / answeredQuestions) * 20;
    const relevanceScore = Math.min(100, Math.max(0, relevanceBase + qualityComponent + consistencyScore));
    
    // Content Quality Score (30% completion, 40% content indicators, 30% depth)
    const contentBase = completionRate * 0.3;
    const contentIndicators = (totalExamples / answeredQuestions) * 20 +
                             (totalActionWords / answeredQuestions) * 10 +
                             (totalNumbers / answeredQuestions) * 10;
    const depthScore = (avgWordCount >= 50) ? 30 : (avgWordCount >= 30) ? 20 : (avgWordCount >= 20) ? 15 : Math.min(30, avgWordCount * 1.5);
    const contentScore = Math.min(100, Math.max(0, contentBase + contentIndicators + depthScore));
    
    // Response Time Score (optimal: 10-60 seconds per question)
    let timeScore = 100;
    if (avgResponseTime < 5) {
        timeScore = 60 - (5 - avgResponseTime) * 5; // Too quick
    } else if (avgResponseTime >= 5 && avgResponseTime <= 10) {
        timeScore = 70 + (avgResponseTime - 5) * 2; // Getting better
    } else if (avgResponseTime > 10 && avgResponseTime <= 60) {
        timeScore = 100 - ((avgResponseTime - 10) / 50) * 20; // Optimal range
    } else if (avgResponseTime > 60 && avgResponseTime <= 120) {
        timeScore = 80 - ((avgResponseTime - 60) / 60) * 30; // Getting long
    } else {
        timeScore = Math.max(40, 50 - ((avgResponseTime - 120) / 60) * 10); // Too long
    }
    timeScore = Math.min(100, Math.max(0, timeScore));
    
    // Overall score (weighted average)
    const overallScore = Math.round(
        communicationScore * 0.25 +
        relevanceScore * 0.25 +
        contentScore * 0.30 +
        timeScore * 0.20
    );
    
    // Store scores for UI update
    setScores(overallScore, communicationScore, relevanceScore, contentScore, timeScore);
    
    // Store detailed metrics for feedback generation
    window.interviewMetrics = {
        totalQuestions,
        answeredQuestions,
        completionRate,
        avgWordCount,
        avgCharCount,
        avgResponseTime,
        totalExamples,
        totalNumbers,
        totalActionWords,
        totalResults,
        responses
    };
}

// Helper function to set scores and update UI
function setScores(overallScore, communicationScore, relevanceScore, contentScore, timeScore) {
    // Update UI
    document.getElementById('overall-score').textContent = overallScore + '%';
    
    // Update individual scores
    setTimeout(() => {
        document.getElementById('communication-score').style.width = communicationScore + '%';
        document.getElementById('relevance-score').style.width = relevanceScore + '%';
        document.getElementById('content-score').style.width = contentScore + '%';
        document.getElementById('time-score').style.width = timeScore + '%';
    }, 100);
    
    // Generate feedback text based on scores
    generateFeedbackText(communicationScore, relevanceScore, contentScore, timeScore);
}

// Generate feedback text
function generateFeedbackText(communicationScore, relevanceScore, contentScore, timeScore) {
    
    const metrics = window.interviewMetrics || {};
    
    document.getElementById('communication-feedback').textContent = 
        communicationScore >= 85 ? 
            'Excellent communication! You provided clear, articulate, and well-structured responses.' :
        communicationScore >= 70 ?
            'Good communication skills. Your responses were clear, though some could be more detailed.' :
        communicationScore >= 55 ?
            'Adequate communication. Work on expressing your thoughts more clearly and providing more context.' :
            'Focus on improving clarity and completeness. Practice articulating your ideas more effectively.';
    
    document.getElementById('relevance-feedback').textContent =
        relevanceScore >= 85 ?
            'Your answers were highly relevant and directly addressed each question with consistency.' :
        relevanceScore >= 70 ?
            'Mostly relevant responses. Some answers could be more directly tied to the questions asked.' :
        relevanceScore >= 55 ?
            'Relevance needs improvement. Focus on directly answering what was asked before adding extra details.' :
            'Work on staying on topic and directly addressing the questions. Avoid going off on tangents.';
    
    document.getElementById('content-feedback').textContent =
        contentScore >= 85 ?
            'Strong content with excellent examples, specific details, and quantifiable results.' :
        contentScore >= 70 ?
            'Good content quality. Consider adding more specific examples and measurable outcomes.' :
        contentScore >= 55 ?
            'Decent content. Include more concrete examples, action words, and quantifiable data.' :
            'Enhance your responses with specific examples, measurable results, and action-oriented language.';
    
    document.getElementById('time-feedback').textContent =
        timeScore >= 85 ?
            'Excellent pacing. You responded in an optimal time frame (10-60 seconds per question).' :
        timeScore >= 70 ?
            'Good response timing. Most answers were well-paced, though some could be more concise.' :
        timeScore >= 55 ?
            'Adequate timing. Work on finding the right balance between thoroughness and conciseness.' :
            'Response timing needs improvement. Aim for 10-60 seconds per question while maintaining quality.';
    
    // Detailed feedback
    const answeredQuestions = metrics.answeredQuestions || 0;
    const totalQuestions = metrics.totalQuestions || 0;
    const completionRate = metrics.completionRate || 0;
    const avgWordCount = metrics.avgWordCount || 0;
    const avgResponseTime = metrics.avgResponseTime || 0;
    const totalExamples = metrics.totalExamples || 0;
    const totalNumbers = metrics.totalNumbers || 0;
    const totalActionWords = metrics.totalActionWords || 0;
    
    let detailedContent = `
        <p><strong>Interview Summary:</strong></p>
        <p>You completed ${answeredQuestions} out of ${totalQuestions} questions (${Math.round(completionRate)}% completion rate).</p>
        <p>Average response length: ${Math.round(avgWordCount)} words (${Math.round(metrics.avgCharCount || 0)} characters).</p>
        <p>Average response time: ${Math.round(avgResponseTime)} seconds per question.</p>
        <p>Your interview style matched well with the ${currentInterview.personality} personality of the interviewer from ${currentInterview.name}.</p>
    `;
    
    if (userResponses.length > 0) {
        detailedContent += '<p><strong>Response Quality Analysis:</strong></p><ul>';
        const responses = metrics.responses || [];
        userResponses.forEach((response, index) => {
            const resp = responses[index] || {};
            const quality = resp.qualityScore >= 70 ? 'excellent' : resp.qualityScore >= 55 ? 'good' : resp.qualityScore >= 40 ? 'adequate' : 'needs improvement';
            const indicators = [];
            if (resp.hasExamples) indicators.push('examples');
            if (resp.hasNumbers) indicators.push('quantifiable data');
            if (resp.hasActionWords) indicators.push('action words');
            const indicatorsText = indicators.length > 0 ? ` (${indicators.join(', ')})` : '';
            detailedContent += `<li><strong>Question ${index + 1}:</strong> ${quality} quality response${indicatorsText} - ${resp.wordCount || 0} words, ${Math.round((resp.responseDuration || 0) / 1000)}s</li>`;
        });
        detailedContent += '</ul>';
        
        if (totalExamples > 0) {
            detailedContent += `<p>✓ You used examples in ${totalExamples} out of ${answeredQuestions} responses, which strengthens your answers.</p>`;
        }
        if (totalNumbers > 0) {
            detailedContent += `<p>✓ You included quantifiable data in ${totalNumbers} responses, adding credibility to your answers.</p>`;
        }
        if (totalActionWords > 0) {
            detailedContent += `<p>✓ You used action-oriented language in ${totalActionWords} responses, demonstrating a proactive approach.</p>`;
        }
    }
    
    document.getElementById('detailed-feedback-content').innerHTML = detailedContent;
    
    // Recommendations
    const recommendations = [];
    
    if (communicationScore < 75) {
        recommendations.push('Practice articulating your thoughts more clearly. Consider using the STAR method (Situation, Task, Action, Result).');
    }
    
    if (relevanceScore < 75) {
        recommendations.push('Focus on directly answering the question asked. Avoid going off on tangents.');
    }
    
    if (contentScore < 75) {
        recommendations.push('Include specific examples from your experience. Quantify your achievements when possible.');
    }
    
    if (timeScore < 75) {
        recommendations.push('Work on being more concise while still providing complete answers.');
    }
    
    if (answeredQuestions < totalQuestions) {
        recommendations.push('Try to answer all questions. If unsure, it\'s okay to say you need a moment to think.');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Great job! Continue practicing to maintain and improve your skills.');
        recommendations.push('Consider trying different interview styles to broaden your experience.');
    }
    
    const recommendationsList = document.getElementById('recommendations-list');
    recommendationsList.innerHTML = '';
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
    });
}

// Load voices when available
if (synthesis.onvoiceschanged !== undefined) {
    synthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}

