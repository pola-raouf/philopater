document.addEventListener('DOMContentLoaded', async () => {
    const visaDetails = document.getElementById('visaDetails');
    const cashDetails = document.getElementById('cash-details');
    const radioVisa = document.getElementById('radioA');
    const radioCash = document.getElementById('radioB');
    const cardInputs = document.querySelectorAll('.card-input');
    const modal = document.getElementById('orderSuccessModal');
    const closeBtn = document.querySelector('.close-btn');
    const expiryInput = document.getElementById('expiryDate');

    let userCart = {};
    let cartIsEmpty = true;

    // ✅ Fetch cart from backend
    try {
        const res = await fetch('/api/get-cart');
        if (res.ok) {
            userCart = await res.json();
            cartIsEmpty = Object.keys(userCart).length === 0;
        } else {
            console.warn('⚠️ Failed to fetch cart:', res.statusText);
        }
    } catch (err) {
        console.error('❌ Fetch cart error:', err);
    }

    // ✅ Toggle payment inputs
    function togglePaymentInputs() {
        if (radioVisa.checked) {
            visaDetails.style.display = 'block';
            cashDetails.style.display = 'none';
            cardInputs.forEach(input => input.disabled = false);
        } else {
            visaDetails.style.display = 'none';
            cashDetails.style.display = 'block';
            cardInputs.forEach(input => input.disabled = true);
        }
    }

    togglePaymentInputs();
    radioVisa.addEventListener('change', togglePaymentInputs);
    radioCash.addEventListener('change', togglePaymentInputs);

    // ✅ Format expiry date
    expiryInput.addEventListener('input', () => {
        let value = expiryInput.value.replace(/\D/g, '');
        if (value.length >= 3) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        expiryInput.value = value;
    });

    // ✅ Validate expiry
    expiryInput.addEventListener('blur', () => {
        const parent = expiryInput.parentElement;
        const oldError = parent.querySelector('.error-message');
        if (oldError) oldError.remove();
        expiryInput.classList.remove('error');

        const [month, year] = expiryInput.value.split('/').map(Number);
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth());
        const inputDate = new Date(`20${year}`, month - 1);

        if (!month || !year || month < 1 || month > 12 || inputDate < currentDate) {
            showExpiryError("❌ Please enter a valid and unexpired date (MM/YY).");
        }
    });

    function showExpiryError(message) {
        const error = document.createElement('div');
        error.classList.add('error-message');
        error.style.color = 'red';
        error.style.marginTop = '5px';
        error.style.fontSize = '0.9rem';
        error.textContent = message;
        expiryInput.classList.add('error');
        expiryInput.parentElement.appendChild(error);
    }

    // ✅ Form submission
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (radioVisa.checked) {
            const [month, year] = expiryInput.value.split('/').map(Number);
            const now = new Date();
            const currentDate = new Date(now.getFullYear(), now.getMonth());
            const inputDate = new Date(`20${year}`, month - 1);

            if (!month || !year || month < 1 || month > 12 || inputDate < currentDate) {
                expiryInput.focus();
                return;
            }
        }

        if (cartIsEmpty) {
            alert("Your cart is empty!");
            return;
        }

        const totalPrice = Object.values(userCart).reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );
        const paymentMethod = radioVisa.checked ? "Visa" : "Cash";

        try {
            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalPrice, paymentMethod })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to place order');
            }

            const data = await res.json();
            console.log("✅", data.message);

            document.getElementById('checkoutForm').style.display = 'none';
            modal.style.display = 'block';

            setTimeout(() => {
                window.location.href = "/homepage";
            }, 3000);
        } catch (err) {
            console.error("❌ Order submission failed:", err);
            alert("Something went wrong while placing your order.");
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
