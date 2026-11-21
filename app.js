const sizes = [
  { label: "200 ml", price: 20 },
  { label: "250 ml", price: 25 },
  { label: "300 ml", price: 30 },
  { label: "360 ml", price: 35 },
];

const fruits = [
  { label: "Banana", icon: "🍌" },
  { label: "Morango", icon: "🍓" },
  { label: "Manga", icon: "🥭" },
  { label: "Abacaxi", icon: "🍍" },
];
const toppings = ["Leite em pó", "Granola", "Paçoca", "Sucrilhos", "M&M’s"];
const sauces = ["Chocolate", "Morango", "Leite condensado"];
const nutella = { label: "Nutella", price: 5 };

const steps = [
  { label: "Tamanho", title: "Escolha o tamanho" },
  { label: "Frutas", title: "Escolha as frutas", description: "Até duas frutas incluídas." },
  { label: "Acompanhamentos", title: "Acompanhamentos", description: "À vontade. Escolha os seus favoritos." },
  { label: "Coberturas", title: "Coberturas e Nutella", description: "Coberturas à vontade." },
  { label: "Resumo", title: "Seu pedido", description: "Confira as escolhas e copie o resumo." },
];
const lastStep = steps.length - 1;

const selections = {
  size: null,
  fruits: new Set(),
  toppings: new Set(),
  sauces: new Set(),
  nutella: false,
};
let activeStep = 0;

const layout = document.querySelector(".layout");
const progress = document.querySelector("#progress");
const stepNumber = document.querySelector("#step-number");
const title = document.querySelector("#step-title");
const description = document.querySelector("#step-description");
const body = document.querySelector("#step-body");
const back = document.querySelector("#back");
const next = document.querySelector("#next");
const total = document.querySelector("#total");
const feedback = document.querySelector("#copy-feedback");
const manualCopy = document.querySelector("#manual-copy");
const orderText = document.querySelector("#order-text");
const mobile = window.matchMedia("(max-width: 720px)");
const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function orderTotal() {
  return selections.size ? selections.size.price + (selections.nutella ? nutella.price : 0) : 0;
}

function updateTotal() {
  const value = selections.size ? real.format(orderTotal()) : "–";
  if (total.value !== value) total.value = value;
  next.disabled = !selections.size || activeStep === lastStep;
}

function choiceGroup(label) {
  const group = node("div", "choices");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  return group;
}

function choice({ name, label, icon, price, type = "checkbox", checked, variant, onChange }) {
  const card = node("label", variant ? "choice choice--" + variant : "choice");
  const input = node("input");
  input.type = type;
  input.name = name;
  input.value = label;
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  card.append(input);

  if (icon) {
    const symbol = node("span", "choice-icon", icon);
    symbol.setAttribute("aria-hidden", "true");
    card.append(symbol);
  }

  const copy = node("span");
  copy.append(node("span", "choice-name", label));
  if (price) copy.append(node("span", "choice-price", price));
  const marker = node("span", "choice-marker");
  marker.setAttribute("aria-hidden", "true");
  card.append(copy, marker);
  return card;
}

function renderSizes() {
  const group = choiceGroup("Tamanhos");
  group.setAttribute("role", "radiogroup");
  for (const size of sizes) {
    group.append(choice({
      name: "size", label: size.label, price: real.format(size.price), type: "radio",
      variant: "size", checked: selections.size === size,
      onChange: () => {
        selections.size = size;
        updateTotal();
      },
    }));
  }
  body.append(group);
}

function renderOptions(name, label, items, values, limit) {
  const group = choiceGroup(label);
  const count = limit ? node("p", "selection-count") : null;
  if (count) {
    count.id = name + "-count";
    count.setAttribute("role", "status");
    group.setAttribute("aria-describedby", count.id);
  }

  function updateLimit() {
    const full = values.size >= limit;
    for (const input of group.querySelectorAll("input")) {
      input.disabled = full && !input.checked;
    }
    count.textContent = full
      ? "2 de 2 frutas escolhidas. Desmarque uma para trocar."
      : values.size + " de 2 frutas escolhidas";
  }

  for (const item of items) {
    const option = typeof item === "string" ? { label: item } : item;
    group.append(choice({
      name, ...option, checked: values.has(option.label),
      onChange: checked => {
        if (checked) values.add(option.label);
        else values.delete(option.label);
        if (count) updateLimit();
      },
    }));
  }
  body.append(group);
  if (count) {
    body.append(count);
    updateLimit();
  }
}

function renderSauces() {
  renderOptions("sauces", "Coberturas", sauces, selections.sauces);
  const extras = choiceGroup("Adicional");
  extras.append(choice({
    name: "nutella", label: nutella.label, price: "+ " + real.format(nutella.price),
    variant: "paid", checked: selections.nutella,
    onChange: checked => {
      selections.nutella = checked;
      updateTotal();
    },
  }));
  body.append(extras);
}

function renderStep(moveFocus = false) {
  const step = steps[activeStep];
  layout.dataset.step = activeStep;
  stepNumber.textContent = "Etapa " + (activeStep + 1) + " de " + steps.length;
  title.textContent = step.title;
  description.textContent = step.description || "";
  description.hidden = !step.description;
  back.hidden = activeStep === 0;
  next.textContent = activeStep === lastStep - 1 ? "Ver resumo" : "Continuar";
  feedback.textContent = "";
  manualCopy.hidden = true;

  progress.replaceChildren(...steps.map((item, index) => {
    const segment = node("li", index < activeStep ? "complete" : null);
    segment.append(node("span", "sr-only", item.label));
    if (index === activeStep) segment.setAttribute("aria-current", "step");
    return segment;
  }));

  body.replaceChildren();
  switch (activeStep) {
    case 0: renderSizes(); break;
    case 1: renderOptions("fruits", "Frutas", fruits, selections.fruits, 2); break;
    case 2: renderOptions("toppings", "Acompanhamentos", toppings, selections.toppings); break;
    case 3: renderSauces(); break;
  }

  updateTotal();
  if (moveFocus) {
    title.focus({ preventScroll: true });
    if (mobile.matches) window.scrollTo(0, 0);
  }
}

back.addEventListener("click", () => {
  if (activeStep > 0) {
    activeStep -= 1;
    renderStep(true);
  }
});

next.addEventListener("click", () => {
  if (!selections.size) return;
  if (activeStep === lastStep) {
    return;
  } else {
    activeStep += 1;
    renderStep(true);
  }
});

renderStep();
