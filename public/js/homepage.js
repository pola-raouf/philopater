document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('modern-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/product';
    });
  }
});
