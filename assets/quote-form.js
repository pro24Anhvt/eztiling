(() => {
  const form = document.querySelector("[data-static-quote-form]");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const whatsappNumber = "64225450778";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.elements.website.value) return;

    const data = new FormData(form);
    const fields = [
      ["Name", data.get("name")],
      ["Phone", data.get("phone")],
      ["Email", data.get("email")],
      ["Suburb", data.get("suburb")],
      ["Project type", data.get("project")],
      ["Project details", String(data.get("details") || "").trim().slice(0, 1_500)],
    ];
    const message = [
      "Hello EZTiling, I would like to request a quote.",
      "",
      ...fields
        .filter(([, value]) => String(value || "").trim())
        .map(([label, value]) => `${label}: ${String(value).trim()}`),
    ].join("\n");

    status.textContent = "Opening WhatsApp. Review the message, then tap Send.";
    status.classList.remove("is-warning");
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  });
})();
