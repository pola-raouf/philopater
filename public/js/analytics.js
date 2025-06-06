async function loadAnalyticsChart() {
  try {
    const res = await fetch('/api/analytics-data');
    const json = await res.json();

    const data = {
      labels: json.labels,
      datasets: [{
        label: 'Purchases per Country',
        data: json.values,
        backgroundColor: '#2c3e50',
        borderColor: '#2c3e50',
        borderWidth: 1
      }]
    };

    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    const canvas = document.getElementById('purchaseChart');
    if (!canvas) {
      console.error('❌ purchaseChart canvas not found in DOM');
      return;
    }

    const ctx = canvas.getContext('2d');
    new Chart(ctx, config);
  } catch (error) {
    console.error('❌ Failed to load analytics chart:', error);
  }
}

document.getElementById('resetBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    const res = await fetch('/api/reset-analytics', { method: 'POST' });
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Reset Successful',
        text: 'Analytics data has been reset.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      setTimeout(() => {
        window.location.href = '/analytics';
      }, 2100);
    } else {
      Swal.fire('Error', 'Failed to reset analytics', 'error');
    }
  } catch (err) {
    Swal.fire('Error', 'Something went wrong', 'error');
  }
});

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    if (toggle && navMenu) {
      toggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
  });

document.addEventListener('DOMContentLoaded', loadAnalyticsChart);

