const SUPABASE_URL = "https://hbokvtzxbqfsrfymiayl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7RobNUwWM8dj9QbczZvBCA_ByazarZl";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzMG7NwbYl0uVscfzv262STSD9PvJD-Lj0BwWLTIKvVZxGsIyTmm0BkT-GjGeLGGDj/exec";

const WEDDING_DATE = new Date("2026-09-26T00:00:00+02:00");
const MAX_GUESTS = 20;

const form = document.querySelector("#rsvp-form");
const entryStep = document.querySelector("#entry-step");
const reviewStep = document.querySelector("#review-step");
const reviewList = document.querySelector("#review-list");
const statusMessage = document.querySelector("#form-status");
const guestCountInput = document.querySelector("#guestCount");
const guestFields = document.querySelector("#guest-fields");
const inviteCodeInput = document.querySelector("#inviteCode");
const reviewButton = document.querySelector("#reviewButton");
const editButton = document.querySelector("#editButton");
const decreaseGuests = document.querySelector("#decreaseGuests");
const increaseGuests = document.querySelector("#increaseGuests");
const submitButton = form.querySelector("button[type='submit']");

const params = new URLSearchParams(window.location.search);
inviteCodeInput.value = params.get("invite") || "";

const hasSupabaseConfig =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY.length > 30 &&
  window.supabase;

const hasGoogleSheetsConfig = GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/");

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function setStatus(message, tone = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function clampGuestCount(count) {
  return Math.max(0, Math.min(count, MAX_GUESTS));
}

function getGuestCount() {
  const count = Number.parseInt(guestCountInput.value || "0", 10);
  return Number.isFinite(count) ? clampGuestCount(count) : 0;
}

function setGuestCount(count) {
  guestCountInput.value = String(clampGuestCount(count));
  renderGuestFields();
}

function renderGuestFields() {
  const count = getGuestCount();
  guestCountInput.value = String(count);
  guestFields.replaceChildren();

  for (let index = 1; index <= count; index += 1) {
    const row = document.createElement("div");
    row.className = "guest-row";
    row.innerHTML = `
      <p class="guest-row-title">Gäst ${index}</p>
      <label class="full-name-field">
        För- och efternamn
        <input
          autocomplete="name"
          name="guest_${index}_fullName"
          placeholder="För- och efternamn"
          required
          type="text"
        />
      </label>
    `;

    guestFields.append(row);
  }
}

function getGuests(data, count) {
  return Array.from({ length: count }, (_, index) => {
    const guestNumber = index + 1;
    const fullName = data.get(`guest_${guestNumber}_fullName`).trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || "";

    return {
      first_name: firstName,
      last_name: nameParts.join(" "),
      full_name: fullName,
    };
  });
}

function getFormPayload() {
  const data = new FormData(form);
  const guestCount = getGuestCount();
  const guests = getGuests(data, guestCount);
  const primaryGuest = guests[0] || null;

  return {
    invite_code: data.get("inviteCode") || null,
    attending: guestCount > 0,
    guest_count: guestCount,
    guests,
    contact_name: primaryGuest
      ? primaryGuest.full_name
      : null,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  };
}

function validatePayload(payload) {
  if (payload.guest_count < 1) {
    return "Skriv hur många som kommer.";
  }

  const missingName = payload.guests.some(
    (guest) => !guest.full_name,
  );

  if (missingName) {
    return "Fyll i för- och efternamn för varje gäst.";
  }

  return "";
}

function renderReview(payload) {
  reviewList.replaceChildren();

  payload.guests.forEach((guest, index) => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <span class="review-label">Gäst ${index + 1}</span>
      <span class="review-name">${guest.full_name}</span>
    `;
    reviewList.append(item);
  });
}

async function sendToGoogleSheets(payload) {
  if (!hasGoogleSheetsConfig) return;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Google Sheets sync failed:", error);
  }
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(0, WEDDING_DATE.getTime() - now.getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  document.querySelector("#daysLeft").textContent = String(days).padStart(2, "0");
  document.querySelector("#hoursLeft").textContent = String(hours).padStart(2, "0");
  document.querySelector("#minutesLeft").textContent = String(minutes).padStart(2, "0");
}

function showEntryStep() {
  entryStep.classList.remove("is-hidden");
  reviewStep.classList.add("is-hidden");
}

function showReviewStep() {
  entryStep.classList.add("is-hidden");
  reviewStep.classList.remove("is-hidden");
}

guestCountInput.addEventListener("input", () => {
  setStatus("");
  renderGuestFields();
});

decreaseGuests.addEventListener("click", () => {
  setStatus("");
  setGuestCount(getGuestCount() - 1);
});

increaseGuests.addEventListener("click", () => {
  setStatus("");
  setGuestCount(getGuestCount() + 1);
});

reviewButton.addEventListener("click", () => {
  const payload = getFormPayload();
  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    setStatus(validationMessage, "error");
    return;
  }

  setStatus("");
  renderReview(payload);
  showReviewStep();
});

editButton.addEventListener("click", () => {
  setStatus("");
  showEntryStep();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const payload = getFormPayload();
  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    setStatus(validationMessage, "error");
    showEntryStep();
    return;
  }

  if (!supabaseClient) {
    console.info("RSVP payload preview:", payload);
    setStatus("Formuläret är klart. Koppla Supabase innan sidan publiceras.");
    return;
  }

  submitButton.disabled = true;
  setStatus("Skickar...");

  const { error } = await supabaseClient.from("rsvps").insert(payload);

  submitButton.disabled = false;

  if (error) {
    console.error(error);
    setStatus("Något gick fel. Försök igen eller kontakta oss direkt.", "error");
    return;
  }

  await sendToGoogleSheets(payload);

  form.reset();
  inviteCodeInput.value = params.get("invite") || "";
  setGuestCount(1);
  showEntryStep();
  setStatus("Tack, ditt svar är registrerat.");
});

renderGuestFields();
updateCountdown();
setInterval(updateCountdown, 60000);
