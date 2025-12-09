const form = document.getElementById('contactForm');
    const success = document.getElementById('successMsg');
    const error = document.getElementById('errorMsg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        success.style.display = 'none';
        error.style.display = 'none';

        let valid = true;
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#ef4444';
                valid = false;
            } else {
                field.style.borderColor = '#e2e8f4';
            }
        });

        if (!valid) {
            error.style.display = 'block';
            return;
        }

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                success.style.display = 'block';
                form.reset();
            } else throw new Error();
        } catch {
            error.style.display = 'block';
        }
    });

    // Smooth scroll
    document.querySelector('.hero-cta').addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('#contact-form').scrollIntoView({ behavior: 'smooth' });
    });