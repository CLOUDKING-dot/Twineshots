// script.js - Full WhatsApp + Cinematic Slider
document.addEventListener("DOMContentLoaded", () => {
  // WhatsApp Modal
  const whatsappBtn = document.getElementById('whatsappBtn');
  const modal = document.getElementById('whatsappModal');
  const closeModal = document.getElementById('closeModal');

  whatsappBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // WhatsApp Buttons
  document.querySelectorAll('.service-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.dataset.phone;
      const msg = encodeURIComponent("Hello! I'd like to inquire about your photography services.");
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    });
  });

  // Category Cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.querySelector('p').textContent;
      alert(`Opening ${cat} gallery...`);
    });
  });

  // ============================
  // Cinematic Category Slider
  // ============================
  const sliderTrack = document.getElementById("sliderTrack");
  const heroBg = document.getElementById("heroBg");
  const mainTitle = document.getElementById("mainTitle");
  const mainDesc = document.getElementById("mainDesc");

  if (sliderTrack) {
    let slides = Array.from(sliderTrack.children);

    // Duplicate for seamless loop
    sliderTrack.innerHTML += sliderTrack.innerHTML;
    slides = Array.from(sliderTrack.querySelectorAll(".slide-card"));

    // Set background images
    slides.forEach(s => {
      if (s.dataset.bg) s.style.backgroundImage = `url('${s.dataset.bg}')`;
    });

    let offset = 0;
    const speed = 0.4;
    const step = () => {
      offset -= speed;
      if (Math.abs(offset) >= sliderTrack.scrollWidth / 2) offset = 0;
      sliderTrack.style.transform = `translateX(${offset}px)`;
      requestAnimationFrame(step);
    };
    step();

    // Update active slide & hero
    let lastActive = null;
    function updateActive() {
      const container = document.querySelector('.category-slider');
      const rect = container.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      let closest = null;
      let minDist = Infinity;

      slides.forEach(slide => {
        const sRect = slide.getBoundingClientRect();
        const slideCenter = sRect.left + sRect.width / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = slide;
        }
      });

      if (closest && closest !== lastActive) {
        if (lastActive) lastActive.classList.remove("active");
        closest.classList.add("active");
        lastActive = closest;

        heroBg.style.backgroundImage = `url('${closest.dataset.bg}')`;
        mainTitle.textContent = closest.dataset.title;
        mainDesc.textContent = closest.dataset.desc;
      }

      requestAnimationFrame(updateActive);
    }
    updateActive();

    // Click to open
    slides.forEach(slide => {
      slide.addEventListener("click", () => {
        alert(`Open ${slide.dataset.title} category`);
      });
    });
  }
});
// Mobile Menu Toggle
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenu = document.getElementById("closeMenu");

    hamburger.addEventListener("click", () => {
        mobileMenu.classList.add("active");
    });

    closeMenu.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
    });

    // Close when clicking outside
    mobileMenu.addEventListener("click", (e) => {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove("active");
        }
    });

    // Your existing WhatsApp + Slider code below...
    // (keep everything you already have)
});