export class ChatError extends Error {
  constructor(msg?: string) {
    super(msg);
    this.name = "ChatError";
  }
}

export class BadNewChatMsgEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadNewChatMsgEventData";
  }
}

export class BadEditedChatMsgEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadEditedChatMsgEventData";
  }
}

export class BadDeletedChatMsgEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadDeletedChatMsgEventData";
  }
}

export class BadLastSeenFeedIdebEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadLastSeenFeedIdebEventData";
  }
}

export class BadLoadOlderMessagesEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadLoadOlderMessagesEventData";
  }
}

export class BadUserTypingEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadUserTypingEventData";
  }
}

export class BadSubscriberOnlineEventData extends ChatError {
  constructor() {
    super();
    this.name = "BadSubscriberOnlineEventData";
  }
}

export class InvalidChatMsgTextError extends ChatError {
  constructor() {
    super();
    this.name = "InvalidChatMsgTextError";
  }
}

export class UserNotFoundError extends ChatError {
  constructor() {
    super();
    this.name = "UserNotFoundError";
  }
}

export class ChatNotFoundError extends ChatError {
  constructor() {
    super();
    this.name = "ChatNotFoundError";
  }
}

export class ChatDisabledError extends ChatError {
  constructor() {
    super();
    this.name = "ChatDisabledError";
  }
}
