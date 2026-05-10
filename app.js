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
      <div class="name-grid">
        <label>
          Förnamn
          <input
            autocomplete="given-name"
            name="guest_${index}_firstName"
            placeholder="Förnamn"
            required
            type="text"
          />
        </label>
        <label>
          Efternamn
          <input
            autocomplete="family-name"
            name="guest_${index}_lastName"
            placeholder="Efternamn"
            required
            type="text"
          />
        </label>
      </div>
    `;

    guestFields.append(row);
  }
}

function getGuests(data, count) {
  return Array.from({ length: count }, (_, index) => {
    const guestNumber = index + 1;

    return {
      first_name: data.get(`guest_${guestNumber}_firstName`).trim(),
      last_name: data.get(`guest_${guestNumber}_lastName`).trim(),
    };
