const WHATSAPP = "5551980592948";

const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("[data-year]");
const form = document.querySelector("[data-booking-form]");
const success = document.querySelector("[data-booking-success]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const onScroll = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(Boolean(open)));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

const maskPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

form?.querySelector('[name="tutorTelefone"]')?.addEventListener("input", (event) => {
  event.target.value = maskPhone(event.target.value);
});

const dateInput = form?.querySelector('[name="data"]');
if (dateInput) {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

let step = 1;

const panels = [...(form?.querySelectorAll("[data-panel]") ?? [])];
const dots = [...document.querySelectorAll("[data-step-dot]")];
const nextBtn = form?.querySelector("[data-next]");
const prevBtn = form?.querySelector("[data-prev]");
const submitBtn = form?.querySelector("[data-submit]");
const errorEl = form?.querySelector("[data-form-error]");

const showError = (message) => {
  if (!errorEl) return;
  errorEl.hidden = !message;
  errorEl.textContent = message || "";
};

const goTo = (next) => {
  step = next;
  panels.forEach((panel) => {
    const id = Number(panel.dataset.panel);
    panel.hidden = id !== step;
    panel.classList.toggle("is-active", id === step);
  });
  dots.forEach((dot) => {
    const id = Number(dot.dataset.stepDot);
    dot.classList.toggle("is-active", id === step);
    dot.classList.toggle("is-done", id < step);
  });
  if (prevBtn) prevBtn.hidden = step === 1;
  if (nextBtn) nextBtn.hidden = step === 4;
  if (submitBtn) submitBtn.hidden = step !== 4;
  showError("");
};

const fieldsFor = (panelEl) => [...panelEl.querySelectorAll("input, select, textarea")].filter((el) => el.type !== "checkbox" || el.required);

const validatePanel = (panelEl) => {
  const radios = [...panelEl.querySelectorAll('input[type="radio"][required], input[type="radio"]')];
  const radioNames = [...new Set(radios.filter((r) => r.required || r.name === "especie").map((r) => r.name))];
  for (const name of radioNames) {
    const group = panelEl.querySelectorAll(`input[name="${name}"]`);
    if (group.length && group[0].required && ![...group].some((r) => r.checked)) {
      return "Escolha a espécie do paciente.";
    }
  }

  for (const field of panelEl.querySelectorAll("input, select, textarea")) {
    if (field.type === "checkbox" || field.type === "radio") continue;
    if (!field.checkValidity()) {
      if (field.name === "tutorTelefone") return "Informe um telefone válido, com DDD.";
      if (field.name === "tutorEmail" && field.value) return "Confira o e-mail informado.";
      if (field.name === "data") return "Escolha uma data a partir de hoje.";
      return "Preencha os campos obrigatórios desta etapa.";
    }
  }

  const phone = form?.tutorTelefone?.value.replace(/\D/g, "") ?? "";
  if (panelEl.dataset.panel === "1" && phone.length < 10) {
    return "Informe um telefone válido, com DDD.";
  }
  return "";
};

nextBtn?.addEventListener("click", () => {
  const panel = panels.find((p) => Number(p.dataset.panel) === step);
  const message = panel ? validatePanel(panel) : "";
  if (message) {
    showError(message);
    return;
  }
  goTo(Math.min(4, step + 1));
});

prevBtn?.addEventListener("click", () => goTo(Math.max(1, step - 1)));

const readForm = () => {
  const data = new FormData(form);
  return {
    tutorNome: data.get("tutorNome")?.toString().trim() ?? "",
    tutorTelefone: data.get("tutorTelefone")?.toString().trim() ?? "",
    tutorEmail: data.get("tutorEmail")?.toString().trim() ?? "",
    primeiraVez: data.get("primeiraVez") ? "Sim" : "Não",
    petNome: data.get("petNome")?.toString().trim() ?? "",
    especie: data.get("especie")?.toString() ?? "",
    petIdade: data.get("petIdade")?.toString().trim() ?? "",
    servico: data.get("servico")?.toString() ?? "",
    dataPref: data.get("data")?.toString() ?? "",
    periodo: data.get("periodo")?.toString() ?? "",
    urgente: data.get("urgente") ? "Sim" : "Não",
    caso: data.get("caso")?.toString().trim() ?? "",
  };
};

const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const buildMessage = (info) =>
  [
    "Olá, US Vet! Gostaria de agendar um atendimento.",
    "",
    `*Tutor:* ${info.tutorNome}`,
    `*Telefone:* ${info.tutorTelefone}`,
    info.tutorEmail ? `*E-mail:* ${info.tutorEmail}` : null,
    `*Primeira vez:* ${info.primeiraVez}`,
    "",
    `*Pet:* ${info.petNome}`,
    `*Espécie:* ${info.especie}`,
    info.petIdade ? `*Idade:* ${info.petIdade}` : null,
    "",
    `*Serviço:* ${info.servico}`,
    `*Data preferida:* ${formatDate(info.dataPref)}`,
    `*Período:* ${info.periodo}`,
    `*Urgente:* ${info.urgente}`,
    "",
    `*Caso:* ${info.caso}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const panel = panels.find((p) => Number(p.dataset.panel) === 4);
  const message = panel ? validatePanel(panel) : "";
  if (message) {
    showError(message);
    return;
  }

  const info = readForm();
  const text = buildMessage(info);
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const waLink = success?.querySelector("[data-wa-link]");
  const copy = success?.querySelector("[data-success-copy]");

  if (copy) {
    copy.textContent = `${info.petNome} · ${info.servico} · ${formatDate(info.dataPref)} · ${info.periodo}`;
  }
  if (waLink) waLink.href = url;
  form.hidden = true;
  if (success) success.hidden = false;
  window.open(url, "_blank", "noopener");
});

document.querySelector("[data-new-booking]")?.addEventListener("click", () => {
  form?.reset();
  if (form) form.hidden = false;
  if (success) success.hidden = true;
  goTo(1);
});

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => {
    const service = button.getAttribute("data-book");
    const select = form?.querySelector('[name="servico"]');
    if (select && service) select.value = service;
    if (service === "Emergência") {
      const urgent = form?.querySelector('[name="urgente"]');
      if (urgent) urgent.checked = true;
    }
    goTo(1);
    document.querySelector("#agendar")?.scrollIntoView({ behavior: "smooth" });
  });
});
