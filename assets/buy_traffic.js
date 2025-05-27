import { createSignal, debounce, flashNow, GENERAL_ERR_MSG } from "$main";

const STRIPE_JS_URL = "https://js.stripe.com/basil/stripe.js";

const PROVIDERS_BY_PAYMENT_TYPE = {
  apple_pay: "Apple Pay",
  google_pay: "Goolge Pay",
  link: "Link",
};

const uploadQuotaEl = document.getElementById("upload-quota");
const colorSchemeQuery = matchMedia("(prefers-color-scheme: dark)");
const debouncedUpdateStripeElements = debounce(updateStripeElements, 200);

let dialog;
let btnClose;
let loaderEl;
let productSummaryEl;
let quantityEl;
let amountEl;
let gigabyteEl;
let errorEl;
let stripe;
let stripePubKey;
let stripeRoot;
let stripeElements;
let expressCheckout;
let pricePerGb;
let isDark = colorSchemeQuery.matches;

// =====================
// Signals
// =====================

export const checkoutSignal = createSignal("idle");
export const dialogOpenSignal = createSignal(false);
const loaderSignal = createSignal(null);
const errorSignal = createSignal(null);
const quantitySignal = createSignal(1);

dialogOpenSignal.subscribe((flag) => {
  if (flag) {
    dialog.showModal();
  } else {
    dialog.close();
    errorSignal.value = null;
  }
});

checkoutSignal.subscribe((event) => {
  btnClose.hidden = ["started", "processing"].includes(event.type);

  if (event.type === "idle") {
    loaderSignal.value = null;
  } else if (event.type === "started") {
    const provider = PROVIDERS_BY_PAYMENT_TYPE[event.paymentType];
    loaderSignal.value = `Waiting ${provider || "Provider"}`;
    errorSignal.value = null;
  } else if (event.type === "processing") {
    loaderSignal.value = "Confirming";
  } else if (event.type === "success") {
    flashNow(
      `Success: ${quantitySignal.value} GB upload quota has been added to your account.`
    );
    dialogOpenSignal.value = false;
  }
});

errorSignal.subscribe((msg) => {
  if (msg) checkoutSignal.value = { type: "idle" };
  renderError(msg);
});

quantitySignal.subscribe(() => {
  debouncedUpdateStripeElements({ amount: getStripeElementsAmount() });
  renderPriceLine();
});

loaderSignal.subscribe(renderLoading);

// =====================
// Global Events
// =====================

colorSchemeQuery.onchange = () => {
  isDark = colorSchemeQuery.matches;
  if (expressCheckout) {
    updateStripeElements({ appearance: getStripeElementsAppearance() });
    expressCheckout.destroy();
    createCheckout();
  }
};

// =====================
// Init Button Show
// =====================

initButtonOpen();

export function initButtonOpen() {
  const btn = document.getElementById("show-buy-traffic");
  btn.disabled = false;

  ({ stripePubKey, pricePerGb } = btn.dataset);

  btn.onclick = () => {
    initDialog();
    dialogOpenSignal.value = true;
  };
}

// =====================
// Init Dialog
// =====================

export function initDialog() {
  if (dialog) return;
  insertDialog();
  initStripe();

  btnClose.onclick = () => {
    dialogOpenSignal.value = false;
  };

  dialog.oncancel = (e) => {
    dialogOpenSignal.value = false;
    e.preventDefault();
  };

  quantityEl.oninput = (e) => {
    const num = Number(e.target.value);
    if (num) quantitySignal.value = num;
  };

  if (uploadQuotaEl) {
    checkoutSignal.subscribe((event) => {
      if (event.type === "success") renderUploadQuota(event.newUploadQuota);
    });
  }
}

// =====================
// Init Stripe
// =====================

async function initStripe() {
  if (stripe) return;
  loaderSignal.value = "Loading";

  try {
    await insertScript(STRIPE_JS_URL);
  } catch (err) {
    errorSignal.value = GENERAL_ERR_MSG;
  }

  stripe = Stripe(stripePubKey);
  createStripeElements();
  createCheckout();
}

// =====================
// Stripe
// =====================

function createStripeElements() {
  stripeElements = stripe.elements({
    mode: "payment",
    currency: "usd",
    amount: getStripeElementsAmount(),
    appearance: getStripeElementsAppearance(),
  });
}

function updateStripeElements(patch) {
  stripeElements?.update(patch);
}

function getStripeElementsAmount() {
  return pricePerGb * quantitySignal.value;
}

function getStripeElementsAppearance() {
  return {
    disableAnimations: true,
    theme: isDark ? "night" : "stripe",
    variables: {
      colorPrimary: isDark ? "white" : "black",
    },
  };
}

async function createPaymentIntent() {
  try {
    const resp = await fetch("/payment/intent", {
      method: "post",
      body: JSON.stringify({ quantity: quantitySignal.value }),
    });
    if (!resp.ok) throw new Error("createPaymentIntent error");
    const data = await resp.json();
    return data;
  } catch (err) {
    console.error(err);
    return {
      error: { message: err.message },
    };
  }
}

function createCheckout() {
  loaderSignal.value = "Loading";

  expressCheckout = stripeElements.create("expressCheckout", {
    lineItems: [
      {
        amount: 100,
        name: "1 GB Upload traffic",
      },
    ],
    paymentMethods: {
      applePay: "always",
      googlePay: "always",
    },
    paymentMethodOrder: ["applePay", "googlePay"],
    layout: {
      maxRows: 2,
    },
  });

  expressCheckout.mount(stripeRoot);

  expressCheckout.on("ready", () => {
    loaderSignal.value = false;
    quantityEl.focus();
  });

  expressCheckout.on("loaderror", (event) => {
    errorSignal.value = GENERAL_ERR_MSG;
  });

  expressCheckout.on("click", (event) => {
    checkoutSignal.value = {
      type: "started",
      paymentType: event.expressPaymentType,
    };
    event.resolve();
  });

  expressCheckout.on("confirm", () => {
    processPayment();
  });

  expressCheckout.on("cancel", () => {
    checkoutSignal.value = { type: "idle" };
  });
}

async function processPayment() {
  checkoutSignal.value = { type: "processing" };

  const { error: submitError } = await stripeElements.submit();

  if (submitError) {
    errorSignal.value = GENERAL_ERR_MSG;
    return;
  }

  const intent = await createPaymentIntent();

  if (intent.error) {
    errorSignal.value =
      intent.error.type === "card_error"
        ? intent.error.message
        : GENERAL_ERR_MSG;
    return;
  }

  const confirm = await stripe.confirmPayment({
    elements: stripeElements,
    clientSecret: intent.client_secret,
    redirect: "if_required",
    confirmParams: {
      return_url: location.href,
    },
  });

  if (confirm.error) {
    const userErrors = ["card_error", "validation_error"];
    errorSignal.value = userErrors.includes(confirm.error.type)
      ? confirm.error.message
      : GENERAL_ERR_MSG;
    return;
  }

  const newUploadQuota = await listenPaymentCreated(confirm.paymentIntent.id);

  checkoutSignal.value = {
    type: "success",
    newUploadQuota,
  };
}

// =====================
// Listen Payment Created
// =====================

function listenPaymentCreated(intentId) {
  return new Promise((resolve) => {
    const source = new EventSource(`/payment/listen-created/${intentId}`);
    source.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.ok) {
        source.close();
        resolve(msg.uploadQuota);
      }
    };
  });
}

// =====================
// Rendering
// =====================

function insertDialog() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="buy-traffic-dialog">
        <h1>Buy Upload Quota</h1>
        <p id="buy-traffic-error" class="alert error" hidden></p>
        <div id="buy-traffic-priduct-summary">
          <input id="buy-traffic-quantity" type="number" min="1" max="100" value="1" />
          <span><span id="buy-traffic-gigabyte">gigabyte</span> for $<output id="buy-traffic-amount">1</output></span>
        </div>
        <div id="buy-traffic-loader" class="spinner-lg spinner-col" hidden></div>
        <div id="stripe-root"></div>
        <form class="basic-form">
          <footer>
            <button id="buy-traffic-close" type="button" autofocus>Cancel</button>
          </footer>
        </form>
      </dialog>
    `
  );
  dialog = document.getElementById("buy-traffic-dialog");
  btnClose = document.getElementById("buy-traffic-close");
  loaderEl = document.getElementById("buy-traffic-loader");
  productSummaryEl = document.getElementById("buy-traffic-priduct-summary");
  quantityEl = document.getElementById("buy-traffic-quantity");
  amountEl = document.getElementById("buy-traffic-amount");
  gigabyteEl = document.getElementById("buy-traffic-gigabyte");
  errorEl = document.getElementById("buy-traffic-error");
  stripeRoot = document.getElementById("stripe-root");
}

function insertScript(src) {
  const el = document.createElement("script");
  el.src = src;
  document.head.appendChild(el);
  return new Promise((resolove, reject) => {
    el.onload = resolove;
    el.onerror = reject;
  });
}

function renderLoading(flagOrMsg) {
  loaderEl.hidden = !flagOrMsg;
  stripeRoot.hidden = !!flagOrMsg;
  productSummaryEl.hidden = !!flagOrMsg;

  if (typeof flagOrMsg === "string") {
    loaderEl.textContent = flagOrMsg;
  } else {
    loaderEl.textContent = "";
  }
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function renderPriceLine() {
  const quantity = quantitySignal.value;
  amountEl.value = quantity;
  gigabyteEl.textContent = quantity > 1 ? "gigabytes" : "gigabyte";
}

function renderUploadQuota(quota) {
  uploadQuotaEl.textContent = quota;
}
