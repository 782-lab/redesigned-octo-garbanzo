document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('med-search-input');
    const searchBtn = document.getElementById('med-search-btn');
    const voiceBtn = document.getElementById('med-voice-btn');
    const imageUploadInput = document.getElementById('med-image-upload');
    const resultsPlaceholder = document.getElementById('med-results-placeholder');

    async function performSearch() {
        const query = searchInput.value.trim();
        if (query === '') {
            resultsPlaceholder.textContent = 'Please enter a medicine name to search.';
            return;
        }
        resultsPlaceholder.textContent = 'Searching...';
        try {
            const response = await fetch('/search_medicine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            resultsPlaceholder.innerHTML = data.response.replace(/\n/g, '<br>');
        } catch (error) {
            console.error('Error:', error);
            resultsPlaceholder.textContent = 'An error occurred during search.';
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') performSearch();
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        voiceBtn.addEventListener('click', () => {
            recognition.start();
        });
        recognition.onresult = (event) => {
            searchInput.value = event.results[0][0].transcript;
            performSearch();
        };
    } else {
        voiceBtn.style.display = 'none';
    }

    imageUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        resultsPlaceholder.textContent = 'Analyzing filename...';
        try {
            const response = await fetch('/search_by_filename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name })
            });
            if (!response.ok) throw new Error('Server processing failed.');
            const data = await response.json();
            resultsPlaceholder.innerHTML = data.response.replace(/\n/g, '<br>');
        } catch (error) {
            console.error('Error:', error);
            resultsPlaceholder.textContent = 'An error occurred while analyzing the filename.';
        }
    });
});