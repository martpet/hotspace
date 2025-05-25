export interface StrypePaymentIntent {
  id: string;
  client_secret: string;
  error?: never;
}

export interface StripeError {
  error: {
    type:
      | "sanitized"
      | "fetch_error"
      | "api_error"
      | "card_error"
      | "idempotency_error"
      | "invalid_request_error";
    code?: string;
    message?: string;
  };
}
