const header = document.querySelector('[data-header]');
const revealItems = [...document.querySelectorAll('[data-reveal]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    revealObserver.observe(item);
  });
}

const tiltRegion = document.querySelector('[data-tilt]');

if (tiltRegion && !reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let frame = 0;

  const renderTilt = () => {
    const spring = 0.085;
    const damping = 0.76;

    velocityX = (velocityX + (targetX - currentX) * spring) * damping;
    velocityY = (velocityY + (targetY - currentY) * spring) * damping;
    currentX += velocityX;
    currentY += velocityY;

    tiltRegion.style.setProperty('--tilt-x', `${currentY * -3.5}deg`);
    tiltRegion.style.setProperty('--tilt-y', `${currentX * 4.5}deg`);
    tiltRegion.style.setProperty('--shift-x', `${currentX * 8}px`);
    tiltRegion.style.setProperty('--shift-y', `${currentY * 7}px`);

    const moving =
      Math.abs(targetX - currentX) > 0.001 ||
      Math.abs(targetY - currentY) > 0.001 ||
      Math.abs(velocityX) > 0.001 ||
      Math.abs(velocityY) > 0.001;

    frame = moving ? requestAnimationFrame(renderTilt) : 0;
  };

  const setTarget = (event) => {
    const bounds = tiltRegion.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(renderTilt);
  };

  const resetTarget = () => {
    targetX = 0;
    targetY = 0;
    if (!frame) frame = requestAnimationFrame(renderTilt);
  };

  tiltRegion.addEventListener('pointermove', setTarget);
  tiltRegion.addEventListener('pointerleave', resetTarget);
}

document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('details[open]').forEach((openDetail) => {
      if (openDetail !== detail) openDetail.open = false;
    });
  });
});

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
