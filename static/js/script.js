document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const chatBox = document.getElementById('chat-box');

    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        const pElement = document.createElement('p');
        pElement.textContent = message;
        messageElement.appendChild(pElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        let hindiVoice = voices.find(voice => voice.lang === 'hi-IN');
        if (hindiVoice) {
            utterance.voice = hindiVoice;
        } else {
            utterance.lang = 'hi-IN';
        }
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
    
    if ('onvoiceschanged' in speechSynthesis) {
        speechSynthesis.onvoiceschanged = () => {};
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        addMessage(message, 'user');
        userInput.value = '';
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            addMessage(data.response, 'bot');
            speak(data.response);
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, kuch gadbad ho gayi. Please try again.', 'bot');
        }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.interimResults = false;
        micBtn.addEventListener('click', () => {
            micBtn.style.backgroundColor = '#FFDDC1';
            recognition.start();
        });
        recognition.onresult = (event) => {
            userInput.value = event.results[0][0].transcript;
            sendMessage();
        };
        recognition.onspeechend = () => {
            recognition.stop();
            micBtn.style.backgroundColor = '#f0f2f5';
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micBtn.style.backgroundColor = '#f0f2f5';
        };
    } else {
        micBtn.style.display = 'none';
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
    });
});