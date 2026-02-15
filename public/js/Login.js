document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.querySelector('.button-text');
    const loadingIcon = document.getElementById('loadingIcon');
    const form = document.getElementById('loginForm');

    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    form.addEventListener('submit', function () {
        buttonText.textContent = 'Authenticating...';
        loadingIcon.style.display = 'inline-block';
        loginButton.disabled = true;
    });

    emailInput.addEventListener('blur', async function () {
        const email = this.value.trim();
        if (!email) return;

        try {
            const res = await fetch(`/check-user?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            const existingMsg = document.querySelector('.email-check-message');
            if (existingMsg) existingMsg.remove();

            const message = document.createElement('div');
            message.className = 'email-check-message';
            message.style.marginTop = '5px';
            message.style.color = data.exists ? 'green' : 'red';
            message.innerText = data.exists ? 'Email found' : 'No account with this email';

            emailInput.parentElement.appendChild(message);

            setTimeout(() => {
                if (message && message.parentElement) {
                    message.remove();
                }
            }, 3000);

        } catch (err) {
            console.error('Failed to check email:', err);
        }
    });
});
