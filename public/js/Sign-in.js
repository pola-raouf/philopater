document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const form = document.getElementById('signupForm');
    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.querySelector('.button-text');
    const loadingIcon = document.getElementById('loadingIcon');
    
    // متطلبات كلمة السر
    const passwordReqs = {
        length: document.getElementById('req-length'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special'),
        upper: document.getElementById('req-upper')
    };

    // عرض/إخفاء كلمة السر
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            togglePasswordVisibility(confirmPasswordInput, this);
        });
    }

    function togglePasswordVisibility(input, icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    }

    // التحقق من كلمة السر
    function checkPasswordRequirements(password) {
        const requirements = {
            length: password.length >= 8,
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            uppercase: /[A-Z]/.test(password)
        };

        // تحديث واجهة المستخدم
        passwordReqs.length.classList.toggle('valid', requirements.length);
        passwordReqs.number.classList.toggle('valid', requirements.number);
        passwordReqs.special.classList.toggle('valid', requirements.special);
        passwordReqs.upper.classList.toggle('valid', requirements.uppercase);

        return Object.values(requirements).every(Boolean);
    }

    // التحقق من الحقول
    function validateField(input, condition, errorId, errorMessage) {
        const errorElement = document.getElementById(errorId);
        const inputGroup = input.closest('.input-field');
        
        if (condition) {
            inputGroup.classList.remove('error');
            if (errorElement) errorElement.textContent = '';
            return true;
        } else {
            inputGroup.classList.add('error');
            if (errorElement) errorElement.textContent = errorMessage;
            return false;
        }
    }

    // التحقق من النموذج
    function validateForm() {
        let isValid = true;
        
        // التحقق من الاسم
        isValid = validateField(
            nameInput, 
            nameInput.value.trim() !== '', 
            'nameError', 
            'Full name is required'
        ) && isValid;
        
        // التحقق من البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailInput.value.trim() !== '' && emailRegex.test(emailInput.value);
        isValid = validateField(
            emailInput, 
            isEmailValid, 
            'emailError', 
            'Please enter a valid email'
        ) && isValid;
        
        // التحقق من كلمة السر
        const isPasswordValid = passwordInput.value.trim() !== '' && 
                              checkPasswordRequirements(passwordInput.value);
        isValid = validateField(
            passwordInput, 
            isPasswordValid, 
            'passwordError', 
            'Password does not meet requirements'
        ) && isValid;
        
        // التحقق من تطابق كلمة السر
        const doPasswordsMatch = confirmPasswordInput.value.trim() !== '' && 
                               confirmPasswordInput.value === passwordInput.value;
        isValid = validateField(
            confirmPasswordInput, 
            doPasswordsMatch, 
            'confirmPasswordError', 
            'Passwords do not match'
        ) && isValid;
        
        return isValid;
    }

    // أحداث الكتابة
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordRequirements(this.value);
            validateField(
                this, 
                this.value.trim() !== '', 
                'passwordError', 
                'Password is required'
            );
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validateField(
                this, 
                this.value === passwordInput.value, 
                'confirmPasswordError', 
                'Passwords do not match'
            );
        });
    }

    [nameInput, emailInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                validateField(
                    this, 
                    this.value.trim() !== '', 
                    `${this.id}Error`, 
                    `${this.previousElementSibling.textContent} is required`
                );
            });
        }
    });

    // إرسال النموذج
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            // عرض حالة التحميل
            if (buttonText) buttonText.textContent = 'Creating Account...';
            if (loadingIcon) loadingIcon.style.display = 'inline-block';
            if (submitButton) submitButton.disabled = true;
            
            // إرسال النموذج برمجياً
            this.submit();
        });
    }
});