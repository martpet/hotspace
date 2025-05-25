import {
  createSignal,
  debounce,
  flashNow,
  GENERAL_ERR_MSG,
  isDev,
} from "$main";

const STRIPE_JS_URL = "https://js.stripe.com/basil/stripe.js";
const colorSchemeQuery = matchMedia("(prefers-color-scheme: dark)");
const uploadDialog = document.getElementById("upload-dialog");
const uploadDialogErrorEl = document.getElementById("upload-dialog-error");
const uploadQuotaEl = document.getElementById("upload-quota");
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
// Init Button Show
// =====================

initButtonShow();

export function initButtonShow() {
  const button = document.getElementById("show-buy-traffic");
  button.disabled = false;

  ({ stripePubKey, pricePerGb } = button.dataset);

  button.onclick = () => {
    initDialog();
    dialogSignal.value = "idle";
    initStripe();
  };
}

// =====================
// Init Dialog
// =====================

function initDialog() {
  if (dialog) return;
  insertDialog();

  btnClose.onclick = () => {
    dialogSignal.value = "closed";
  };

  dialog.oncancel = (e) => {
    e.preventDefault();
    dialogSignal.value = "closed";
  };

  quantityEl.oninput = (e) => {
    const num = Number(e.target.value);
    if (num) quantitySignal.value = num;
  };
}

// =====================
// Init Stripe
// =====================

export function preloadStripe() {
  initDialog();
  initStripe();
}

async function initStripe() {
  if (stripe) return;
  loadingSignal.value = "Loading";

  try {
    await insertScript(STRIPE_JS_URL);
  } catch (err) {
    errorSignal.value = { msg: err.message };
  }

  stripe = Stripe(stripePubKey);
  createStripeElements();
  createExpressCheckout();
}

// =====================
// Global Events
// =====================

colorSchemeQuery.onchange = () => {
  isDark = colorSchemeQuery.matches;
  if (expressCheckout) {
    updateStripeElements({ appearance: getStripeElementsAppearance() });
    expressCheckout.destroy();
    createExpressCheckout();
  }
};

// =====================
// Signals
// =====================

const dialogSignal = createSignal("closed");
const loadingSignal = createSignal();
const errorSignal = createSignal();
const quantitySignal = createSignal(1);

dialogSignal.subscribe((status) => {
  btnClose.hidden = ["clicked", "confirmed"].includes(status);

  if (status === "idle") {
    dialog.showModal();
    loadingSignal.value = false;
  } else if (status === "confirmed") {
    errorSignal.value = null;
  } else if (status === "closed") {
    dialog.close();
  }

  if (uploadDialog) {
    uploadDialog.hidden = status !== "closed";
  }
});

loadingSignal.subscribe(renderLoading);

quantitySignal.subscribe(() => {
  debouncedUpdateStripeElements({ amount: getStripeElementsAmount() });
  renderPriceLine();
});

errorSignal.subscribe((err) => {
  renderError(err);
  if (err) dialogSignal.value = "idle";
});

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

function createExpressCheckout() {
  loadingSignal.value = "Loading";

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
    loadingSignal.value = false;
    quantityEl.focus();
  });

  expressCheckout.on("loaderror", (event) => {
    errorSignal.value = { msg: event.error.message };
  });

  expressCheckout.on("click", (event) => {
    dialogSignal.value = "clicked";
    loadingSignal.value = "Waiting Provider";
    event.resolve();
  });

  expressCheckout.on("confirm", () => {
    dialogSignal.value = "confirmed";
    loadingSignal.value = "Confirming";
    handleExpressCheckoutConfirm();
  });

  expressCheckout.on("cancel", () => {
    dialogSignal.value = "idle";
  });
}

async function handleExpressCheckoutConfirm() {
  const { error: submitError } = await stripeElements.submit();

  if (submitError) {
    errorSignal.value = { msg: submitError.message };
    return;
  }

  const intent = await createPaymentIntent();

  if (intent.error) {
    const msg = isDev ? intent.error.type : intent.error.message;
    const showUser = intent.error.type === "card_error";
    errorSignal.value = { msg, showUser };
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
    const msg = confirm.error.message;
    const showUser = ["card_error", "validation_error"].includes(
      confirm.error.type
    );
    errorSignal.value = { msg, showUser };
    return;
  }

  const newUploadQuota = await listenPaymentCreated(confirm.paymentIntent.id);

  if (uploadQuotaEl) uploadQuotaEl.textContent = newUploadQuota;
  if (uploadDialogErrorEl) uploadDialogErrorEl.remove();

  dialogSignal.value = "closed";
  flashNow(`Success: ${quantitySignal.value} GB added to your upload quota`);
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
        <div id="buy-traffic-loader" class="spinner-lg"></div>
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

function renderError(err) {
  if (err) {
    errorEl.textContent = err.showUser || isDev ? err.msg : GENERAL_ERR_MSG;
  } else {
    errorEl.textContent = "";
  }
  errorEl.hidden = !err.msg;
}

function renderPriceLine() {
  const quantity = quantitySignal.value;
  amountEl.value = quantity;
  gigabyteEl.textContent = quantity > 1 ? "gigabytes" : "gigabyte";
}
