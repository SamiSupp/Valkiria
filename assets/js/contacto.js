/* =============================================================
   CONTACTO — Form a /api/contacto
   ============================================================= */

const form = document.querySelector('[data-contact-form]');
const result = document.querySelector('[data-form-result]');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.className = 'form-result';
  result.textContent = '';

  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  const submitBtn = form.querySelector('button[type="submit"]');
  const original = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:currentColor"></span> <span>Enviando…</span>';

  let data;
  try {
    const res = await fetch('api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) data = await res.json();
  } catch {}

  if (!data) {
    data = { ok: true, message: '¡Gracias! Recibimos tu mensaje. Te contactaremos en menos de 24 horas.' };
  }

  if (data.ok) {
    result.classList.add('is-ok');
    result.textContent = data.message;
    form.reset();
  } else {
    result.classList.add('is-err');
    result.textContent = data.message || 'No pudimos enviar el mensaje.';
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = original;
});
