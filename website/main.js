import './style.css';
document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Tab Switching Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const setupPanes = document.querySelectorAll('.setup-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all tabs and panes
      tabBtns.forEach(b => b.classList.remove('active'));
      setupPanes.forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
      });

      // Add active to clicked tab
      btn.classList.add('active');

      // Show target pane
      const targetId = btn.getAttribute('data-target');
      const targetPane = document.getElementById(targetId);
      
      if (targetPane) {
        targetPane.style.display = 'block';
        // Small timeout to allow display:block to apply before adding class for animation
        setTimeout(() => {
          targetPane.classList.add('active');
        }, 10);
      }
    });
  });

  // Simple scroll animation observer
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Pause animations initially for elements below fold, then observe them
  document.querySelectorAll('.features-grid .feature-card').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.animation = `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s forwards`;
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
});
