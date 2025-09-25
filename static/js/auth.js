document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); 
            console.log('Login successful (simulation). Redirecting to dashboard...');
            window.location.href = '/dashboard';
        });
    }
});