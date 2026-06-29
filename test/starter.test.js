import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBusinessContext,
  createCheckHoursTool,
  createFrontDeskSystemPrompt,
  createMelliStarter,
  createOllamaProvider,
  createTelegramAdapter,
  createTelegramReply,
  extractTelegramMessage,
} from '../src/index.js';

test('routes to configured provider', async () => {
  const melli = createMelliStarter({
    defaultProvider: 'fake',
    providers: {
      fake: {
        async chat() {
          return { content: 'hello' };
        },
      },
    },
  });

  const result = await melli.chat({ messages: [] });
  assert.equal(result.content, 'hello');
  assert.equal(result.provider, 'fake');
});

test('falls back to second provider', async () => {
  const melli = createMelliStarter({
    defaultProvider: 'first',
    fallbackOrder: ['first', 'second'],
    providers: {
      first: {
        async chat() {
          throw new Error('first failed');
        },
      },
      second: {
        async chat() {
          return { content: 'fallback' };
        },
      },
    },
  });

  const result = await melli.chat({ messages: [] });
  assert.equal(result.content, 'fallback');
  assert.equal(result.provider, 'second');
});

test('blocks public Ollama base URLs by default', () => {
  assert.throws(
    () => createOllamaProvider({ baseUrl: 'https://example.com', model: 'llama3.1' }),
    /local\/private/,
  );
});

test('allows local Ollama base URL', () => {
  assert.doesNotThrow(() => createOllamaProvider({ baseUrl: 'http://localhost:11434', model: 'llama3.1' }));
});

test('extracts text messages from Telegram updates', () => {
  const input = extractTelegramMessage({
    message: {
      message_id: 12,
      chat: { id: 345 },
      from: { id: 678, username: 'customer' },
      text: ' Are you open tonight? ',
    },
  });

  assert.deepEqual(
    {
      chatId: input.chatId,
      messageId: input.messageId,
      userId: input.userId,
      username: input.username,
      text: input.text,
    },
    {
      chatId: 345,
      messageId: 12,
      userId: 678,
      username: 'customer',
      text: 'Are you open tonight?',
    },
  );
});

test('creates Telegram reply payloads', () => {
  assert.deepEqual(
    createTelegramReply({ chatId: 345, text: 'Yes, we are open.', replyToMessageId: 12 }),
    {
      chat_id: 345,
      text: 'Yes, we are open.',
      reply_to_message_id: 12,
    },
  );
});

test('Telegram adapter routes message through MELLI starter', async () => {
  const melli = createMelliStarter({
    defaultProvider: 'fake',
    providers: {
      fake: {
        async chat(request) {
          assert.equal(request.messages.at(-1).content, 'Can I book a table?');
          return { content: 'I can help with that.' };
        },
      },
    },
  });

  const telegram = createTelegramAdapter({
    melli,
    business: {
      businessName: 'MELLI Cafe',
      hours: { monday: '9 AM - 5 PM' },
    },
  });

  const result = await telegram.handleUpdate({
    message: {
      message_id: 1,
      chat: { id: 2 },
      text: 'Can I book a table?',
    },
  });

  assert.equal(result.provider, 'fake');
  assert.equal(result.content, 'I can help with that.');
  assert.deepEqual(result.reply, {
    chat_id: 2,
    text: 'I can help with that.',
    reply_to_message_id: 1,
  });
});

test('front desk helpers create prompt, context, and tools', async () => {
  const prompt = createFrontDeskSystemPrompt({ businessName: 'MELLI Cafe' });
  const context = createBusinessContext({
    businessName: 'MELLI Cafe',
    menuHighlights: ['latte', 'matcha'],
  });
  const hours = createCheckHoursTool({ monday: '9 AM - 5 PM', default: 'closed' });

  assert.match(prompt, /MELLI Cafe/);
  assert.match(context, /latte, matcha/);
  assert.equal(await hours.execute({ day: 'Monday' }), '9 AM - 5 PM');
});
