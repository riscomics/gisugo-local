// Job page specific scripts will go here. 

document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.jobcat-menu-btn');
  const menuOverlay = document.getElementById('jobcatMenuOverlay');
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuOverlay.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
      if (
        menuOverlay.classList.contains('show') &&
        !menuBtn.contains(e.target) &&
        !menuOverlay.contains(e.target)
      ) {
        menuOverlay.classList.remove('show');
      }
    }, true);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        menuOverlay.classList.remove('show');
      }
    });
  }
}); 