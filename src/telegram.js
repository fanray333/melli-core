import { createBusinessContext, createFrontDeskSystemPrompt } from './frontdesk.js';

function getMessage(update = {}) {
  return update.message || update.edited_message || update.channel_post || null;
}

export function extractTelegramMessage(update = {}) {
  const message = getMessage(update);
  const text = typeof message?.text === 'string' ? message.text.trim() : '';
  const chatId = message?.chat?.id;

  if (!message || !text || chatId === undefined || chatId === null) return null;

  return {
    chatId,
    messageId: message.message_id,
    userId: message.from?.id,
    username: message.from?.username,
    text,
    raw: message,
  };
}

export function createTelegramReply({ chatId, text, replyToMessageId, parseMode } = {}) {
  if (chatId === undefined || chatId === null) throw new Error('Telegram reply requires chatId');
  if (!text) throw new Error('Telegram reply requires text');

  return {
    chat_id: chatId,
    text,
    ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
    ...(parseMode ? { parse_mode: parseMode } : {}),
  };
}

export function createTelegramAdapter(options = {}) {
  const core = options.core;
  if (!core?.chat) throw new Error('Telegram adapter requires core.chat');

  const systemPrompt = options.systemPrompt || createFrontDeskSystemPrompt(options.business || {});
  const businessContext = options.businessContext || createBusinessContext(options.business || {});

  async function handleUpdate(update, requestOptions = {}) {
    const input = extractTelegramMessage(update);
    if (!input) return null;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(businessContext ? [{ role: 'system', content: businessContext }] : []),
      { role: 'user', content: input.text },
    ];

    const result = await core.chat({
      ...requestOptions,
      messages,
    });

    return {
      input,
      provider: result.provider,
      content: result.content,
      reply: createTelegramReply({
        chatId: input.chatId,
        text: result.content,
        replyToMessageId: input.messageId,
      }),
      raw: result,
    };
  }

  return { handleUpdate };
}

export async function sendTelegramMessage(options = {}) {
  const botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('sendTelegramMessage requires botToken or TELEGRAM_BOT_TOKEN');

  const baseUrl = String(options.baseUrl || 'https://api.telegram.org').replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(createTelegramReply(options)),
    signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.description || `Telegram sendMessage failed: ${response.status}`);
  }

  return payload;
}
