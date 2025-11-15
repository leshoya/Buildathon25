# AI Interview Practice - Live Video Interview Simulator

A text-to-speech live video interview website (Zoom-style) where users can practice interviews with AI bots that simulate different company styles and personalities.

## Features

- 📹 **Video Interview Interface**: Zoom-style video call interface with webcam support
- 🎤 **Voice-Enabled Interviews**: Speak your answers using speech-to-text
- 🤖 **AI Interviewers**: Multiple personalities from different companies/industries with animated avatars
- ⏱️ **Interview Length Selection**: Choose from Short (3 questions), Medium (5 questions), or Long (8 questions)
- 🎯 **Customizable Styles**: Choose from various interview styles (Tech, Finance, Startup, Corporate, Creative)
- 📊 **Detailed Feedback**: Get comprehensive feedback on your performance
- 💬 **Real-time Interaction**: Natural conversation flow with text-to-speech responses
- 🎛️ **Video Controls**: Toggle microphone and camera on/off during the interview
- ⏱️ **Live Timer**: Track interview duration in real-time

## Interview Styles Available

- **Tech Companies**: Google (Friendly), Microsoft (Professional), Apple (Creative)
- **Finance**: Goldman Sachs (Analytical), McKinsey (Strategic)
- **Startup**: Fast-paced and casual
- **Corporate**: Traditional and formal
- **Creative Agency**: Energetic and dynamic

## Installation & Setup

### Using npm (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   Or for auto-open in browser:
   ```bash
   npm run dev
   ```

3. The app will be available at `http://localhost:8080`

### Alternative: Direct File Access

Simply open `index.html` in a modern web browser (Note: Camera/microphone access requires HTTPS or localhost)

## How to Use

1. Open the application in your browser (via npm server or directly)
2. Select your preferred company/industry, position type, difficulty level, and interview length
3. Click "Start Interview"
4. Allow camera and microphone access when prompted
5. The interview will start in a Zoom-style video interface
6. Listen to the AI interviewer's questions (shown in transcript bubbles)
7. Click the "Speak" button to respond with your answer
8. Use the video controls to toggle your microphone or camera if needed
9. Complete all questions
10. Review your detailed feedback and recommendations

## Browser Requirements

- **Chrome** or **Edge** (recommended for speech recognition and camera access)
- Modern browser with Web Speech API support
- Camera and microphone access required
- HTTPS or localhost (required for camera/microphone access)

## Technologies Used

- HTML5
- CSS3 (with modern gradients and animations)
- JavaScript (Web Speech API for TTS and STT)
- Node.js & npm for development server
- http-server or serve for hosting

## Development

### Available Scripts

- `npm start` - Start the development server on port 8080
- `npm run dev` - Start server and auto-open in browser
- `npm run build` - Build/prepare for deployment (static site, no build needed)
- `npm run serve` - Alternative server using `serve` package

### Deployment

Since this is a static site, you can deploy it to:
- **Netlify**: Drag and drop the folder or connect to Git
- **Vercel**: `vercel` command or connect to Git
- **GitHub Pages**: Push to GitHub and enable Pages
- **Any static hosting**: Upload all files to your hosting provider

## Notes

- Speech recognition works best in Chrome or Edge browsers
- Ensure your camera and microphone permissions are enabled
- The website must be served over HTTPS or localhost for camera/microphone access
- The feedback system analyzes response quality, relevance, communication, and timing
- The AI interviewer features an animated avatar that responds during speech

## Future Enhancements

- Integration with OpenAI API for more sophisticated AI responses
- Save interview history
- More detailed analytics
- Custom question sets
- Multi-language support

