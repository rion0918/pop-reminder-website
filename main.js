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

const waitlistForm = document.querySelector('[data-waitlist-form]');

if (waitlistForm) {
  const submitButton = waitlistForm.querySelector('[data-waitlist-submit]');
  const cancelButton = waitlistForm.querySelector('[data-waitlist-cancel]');
  const buttonLabel = waitlistForm.querySelector('[data-waitlist-button-label]');
  const status = waitlistForm.querySelector('[data-waitlist-status]');
  const idKey = 'pop-reminder-waitlist-client-id';
  const joinedKey = 'pop-reminder-waitlist-joined';
  let fallbackClientId = '';

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // The waitlist still works for this page view when storage is unavailable.
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing else is required when storage is unavailable.
      }
    },
  };

  const createClientId = () => {
    if (window.crypto.randomUUID) return window.crypto.randomUUID();

    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  };

  const getClientId = () => {
    const savedClientId = storage.get(idKey);
    if (savedClientId) return savedClientId;
    if (!fallbackClientId) fallbackClientId = createClientId();
    storage.set(idKey, fallbackClientId);
    return fallbackClientId;
  };

  const setBusy = (busy) => {
    submitButton.disabled = busy || waitlistForm.dataset.state === 'joined';
    submitButton.setAttribute('aria-busy', String(busy));
    cancelButton.disabled = busy;
  };

  const renderJoined = (joined) => {
    waitlistForm.dataset.state = joined ? 'joined' : 'idle';
    buttonLabel.textContent = joined ? '待機リストに参加済み' : 'リリースを待つ';
    submitButton.disabled = joined;
    submitButton.setAttribute('aria-busy', 'false');
    cancelButton.hidden = !joined;
    cancelButton.disabled = false;
  };

  const utm = () => {
    const search = new URLSearchParams(window.location.search);
    return {
      utmSource: search.get('utm_source'),
      utmMedium: search.get('utm_medium'),
      utmCampaign: search.get('utm_campaign'),
      utmContent: search.get('utm_content'),
    };
  };

  const send = async (method, payload) => {
    const response = await fetch('/api/waitlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error ?? 'request_failed');
    return data;
  };

  if (storage.get(joinedKey) === 'true' && storage.get(idKey)) {
    renderJoined(true);
    status.textContent = 'このブラウザから待機リストに参加済みです。';
  }

  waitlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (waitlistForm.dataset.state === 'joined') return;

    setBusy(true);
    status.textContent = '参加を登録しています…';

    try {
      await send('POST', {
        clientId: getClientId(),
        website: waitlistForm.elements.website.value,
        ...utm(),
      });
      storage.set(joinedKey, 'true');
      renderJoined(true);
      status.textContent = 'ありがとうございます。あなたの1件が、次の一歩になります。';
    } catch {
      renderJoined(false);
      status.textContent = '登録できませんでした。通信を確認して、もう一度お試しください。';
    }
  });

  cancelButton.addEventListener('click', async () => {
    const clientId = storage.get(idKey) || fallbackClientId;
    if (!clientId) {
      storage.remove(joinedKey);
      renderJoined(false);
      status.textContent = '参加状態を解除しました。';
      return;
    }

    setBusy(true);
    status.textContent = '参加を取り消しています…';

    try {
      await send('DELETE', { clientId });
      storage.remove(joinedKey);
      renderJoined(false);
      status.textContent = '参加を取り消しました。いつでも、また参加できます。';
    } catch {
      renderJoined(true);
      status.textContent = '取り消せませんでした。通信を確認して、もう一度お試しください。';
    }
  });
}
