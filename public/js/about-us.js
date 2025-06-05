document.getElementById('learn-more-btn').addEventListener('click', function() {
  const moreContent = document.getElementById('more-content');

  if (moreContent.classList.contains('hidden')) {
    moreContent.classList.remove('hidden');
    this.textContent = "Show Less";
  } else {
    moreContent.classList.add('hidden');
    this.textContent = "Learn More";
  }
});