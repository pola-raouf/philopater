document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.querySelector('.button-text');
    const loadingIcon = document.getElementById('loadingIcon');
    const form = document.getElementById('loginForm');

    // 👁️ Toggle show/hide password
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // 🔄 Visual feedback on form submit
    form.addEventListener('submit', function () {
        buttonText.textContent = 'Authenticating...';
        loadingIcon.style.display = 'inline-block';
        loginButton.disabled = true;
    });

    // 📧 Check if email exists via AJAX
    emailInput.addEventListener('blur', async function () {
        const email = this.value.trim();
        if (!email) return;

        try {
            const res = await fetch(`/check-user?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            // Remove previous message
            const existingMsg = document.querySelector('.email-check-message');
            if (existingMsg) existingMsg.remove();

            // Create new message
            const message = document.createElement('div');
            message.className = 'email-check-message';
            message.style.marginTop = '5px';
            message.style.color = data.exists ? 'green' : 'red';
            message.innerText = data.exists ? '✅ Email found' : '❌ No account with this email';

            emailInput.parentElement.appendChild(message);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (message && message.parentElement) {
                    message.remove();
                }
            }, 3000);

        } catch (err) {
            console.error('❌ Failed to check email:', err);
        }
    });
});
