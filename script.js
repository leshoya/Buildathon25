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
    interviewStartTime = Date.now();
    
    // Update UI
    document.getElementById('interviewer-name-display').textContent = currentInterview.name;
    document.getElementById('total-questions').textContent = currentInterview.questions.length;
    
    showPage('interview-page');
    
    // Start camera
    await startCamera();
    
    // Start timer
    startTimer();
    
    // Start with greeting
    setTimeout(() => {
        askQuestion(0);
    }, 1000);
}

// Start camera
async function startCamera() {
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
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please allow camera and microphone permissions.');
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
    if (userStream) {
        const audioTracks = userStream.getAudioTracks();
        isMicOn = !isMicOn;
        audioTracks.forEach(track => {
            track.enabled = isMicOn;
        });
        const micBtn = document.getElementById('mic-btn');
        if (isMicOn) {
            micBtn.classList.add('active');
            micBtn.querySelector('.control-icon').textContent = '🎤';
        } else {
            micBtn.classList.remove('active');
            micBtn.querySelector('.control-icon').textContent = '🔇';
        }
    }
}

// Toggle camera
function toggleCamera() {
    if (userStream) {
        const videoTracks = userStream.getVideoTracks();
        isCameraOn = !isCameraOn;
        videoTracks.forEach(track => {
            track.enabled = isCameraOn;
        });
        const cameraBtn = document.getElementById('camera-btn');
        const placeholder = document.getElementById('video-placeholder');
        if (isCameraOn) {
            cameraBtn.classList.add('active');
            cameraBtn.querySelector('.control-icon').textContent = '📹';
            placeholder.classList.add('hidden');
        } else {
            cameraBtn.classList.remove('active');
            cameraBtn.querySelector('.control-icon').textContent = '📷';
            placeholder.classList.remove('hidden');
        }
    }
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
    
    // Speak question
    speakText(question);
    
    updateStatus('Ready to listen');
    document.getElementById('user-status').textContent = 'Ready';
}

// Handle user response
function handleUserResponse(transcript) {
    const responseTime = Date.now() - interviewStartTime;
    responseTimes.push(responseTime);
    
    userResponses.push({
        question: currentInterview.questions[currentQuestionIndex],
        answer: transcript,
        time: responseTime
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
    
    // Analyze responses
    const avgResponseLength = userResponses.reduce((sum, r) => sum + r.answer.length, 0) / Math.max(answeredQuestions, 1);
    const avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : 0;
    
    // Analyze response quality indicators
    const hasExamples = userResponses.some(r => 
        r.answer.toLowerCase().includes('example') || 
        r.answer.toLowerCase().includes('for instance') ||
        r.answer.toLowerCase().includes('i ') ||
        r.answer.toLowerCase().includes('we ')
    );
    const hasNumbers = userResponses.some(r => /\d+/.test(r.answer));
    const hasActionWords = userResponses.some(r => 
        /(achieved|implemented|developed|created|improved|led|managed)/i.test(r.answer)
    );
    
    // Calculate scores (more sophisticated scoring)
    let communicationScore = Math.min(100, Math.max(60, completionRate * 0.8 + (avgResponseLength > 50 ? 15 : 0) + (hasExamples ? 10 : 0)));
    let relevanceScore = Math.min(100, Math.max(65, completionRate * 0.85 + 10 + (avgResponseLength > 30 ? 5 : 0)));
    let contentScore = Math.min(100, Math.max(70, completionRate * 0.75 + (avgResponseLength > 100 ? 15 : 0) + (hasExamples ? 10 : 0) + (hasActionWords ? 5 : 0) + (hasNumbers ? 5 : 0)));
    let timeScore = Math.min(100, Math.max(60, 100 - (avgResponseTime > 30000 ? 15 : 0) - (avgResponseTime < 5000 ? 10 : 0)));
    
    const overallScore = Math.round((communicationScore + relevanceScore + contentScore + timeScore) / 4);
    
    // Update UI
    document.getElementById('overall-score').textContent = overallScore + '%';
    
    // Update individual scores
    setTimeout(() => {
        document.getElementById('communication-score').style.width = communicationScore + '%';
        document.getElementById('relevance-score').style.width = relevanceScore + '%';
        document.getElementById('content-score').style.width = contentScore + '%';
        document.getElementById('time-score').style.width = timeScore + '%';
    }, 100);
    
    // Generate feedback text
    document.getElementById('communication-feedback').textContent = 
        communicationScore >= 80 ? 
            'Excellent communication! You provided clear and articulate responses.' :
        communicationScore >= 65 ?
            'Good communication skills. Try to be more detailed in your explanations.' :
            'Work on expressing your thoughts more clearly and completely.';
    
    document.getElementById('relevance-feedback').textContent =
        relevanceScore >= 80 ?
            'Your answers were highly relevant to the questions asked.' :
        relevanceScore >= 65 ?
            'Mostly relevant responses. Focus on directly addressing the question.' :
            'Some answers could be more directly related to the questions.';
    
    document.getElementById('content-feedback').textContent =
        contentScore >= 80 ?
            'Strong content with good examples and details.' :
        contentScore >= 65 ?
            'Decent content. Consider adding more specific examples.' :
            'Try to provide more detailed examples and concrete experiences.';
    
    document.getElementById('time-feedback').textContent =
        timeScore >= 80 ?
            'Good pacing. You responded in a timely manner.' :
        timeScore >= 65 ?
            'Adequate response time. Try to be more concise when possible.' :
            'Consider working on responding more quickly while maintaining quality.';
    
    // Detailed feedback
    let detailedContent = `
        <p><strong>Interview Summary:</strong></p>
        <p>You completed ${answeredQuestions} out of ${totalQuestions} questions (${Math.round(completionRate)}% completion rate).</p>
        <p>Average response length: ${Math.round(avgResponseLength)} characters.</p>
        <p>Average response time: ${Math.round(avgResponseTime / 1000)} seconds per question.</p>
        <p>Your interview style matched well with the ${currentInterview.personality} personality of the interviewer from ${currentInterview.name}.</p>
    `;
    
    if (userResponses.length > 0) {
        detailedContent += '<p><strong>Response Analysis:</strong></p><ul>';
        userResponses.forEach((response, index) => {
            const quality = response.answer.length > 150 ? 'detailed' : response.answer.length > 80 ? 'moderate' : 'brief';
            const hasExample = /(example|instance|i |we |project|experience)/i.test(response.answer);
            detailedContent += `<li><strong>Question ${index + 1}:</strong> ${quality} response${hasExample ? ' with examples' : ''} (${response.answer.length} chars)</li>`;
        });
        detailedContent += '</ul>';
        
        if (hasExamples) {
            detailedContent += '<p>✓ You effectively used examples in your responses, which strengthens your answers.</p>';
        }
        if (hasNumbers) {
            detailedContent += '<p>✓ You included quantifiable data, which adds credibility to your responses.</p>';
        }
        if (hasActionWords) {
            detailedContent += '<p>✓ You used action-oriented language, demonstrating your proactive approach.</p>';
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

