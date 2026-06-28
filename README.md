# MELLI Core

Public-safe core for MELLI AI.

MELLI Core gives you a small provider router for customer-specific AI apps. It supports:

- Ollama local models
- OpenAI-compatible APIs, including Agnes-style providers
- Telegram customer entrypoints
- Basic front desk prompts and tools
- Provider fallback
- Tool contracts

This repo does not include private MELLI SaaS code, customer data, billing, production routes, API keys, deployment config, or private prompts.

## Install

```bash
npm install
npm test
```

## Quick Start

```js
import {
  createBusinessContext,
  createFrontDeskSystemPrompt,
  createMelliCore,
  createOllamaProvider,
  createOpenAICompatibleProvider,
} from '@melliai/core';

const core = createMelliCore({
  defaultProvider: 'ollama',
  fallbackOrder: ['ollama', 'agnes'],
  providers: {
    ollama: createOllamaProvider({
      model: process.env.OLLAMA_MODEL || 'llama3.1',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    }),
    agnes: createOpenAICompatibleProvider({
      name: 'agnes',
      model: process.env.AGNES_MODEL || 'agnes-2.0-flash',
      baseUrl: process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1',
      apiKey: process.env.AGNES_API_KEY,
    }),
  },
});

const messages = [
  {
    role: 'system',
    content: createFrontDeskSystemPrompt({
      businessName: 'MELLI Cafe',
    }),
  },
  {
    role: 'system',
    content: createBusinessContext({
      businessName: 'MELLI Cafe',
      hours: { monday: '9 AM - 5 PM' },
      menuHighlights: ['coffee', 'matcha', 'lunch sets'],
    }),
  },
  { role: 'user', content: 'Can I book a table for tonight?' },
];

const result = await core.chat({
  messages,
});

console.log(result.provider);
console.log(result.content);
```

## Telegram

Use the Telegram adapter inside your own webhook route.

```js
import {
  createMelliCore,
  createOllamaProvider,
  createTelegramAdapter,
  sendTelegramMessage,
} from '@melliai/core';

const core = createMelliCore({
  defaultProvider: 'ollama',
  providers: {
    ollama: createOllamaProvider({
      model: process.env.OLLAMA_MODEL || 'llama3.1',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    }),
  },
});

const telegram = createTelegramAdapter({
  core,
  business: {
    businessName: 'MELLI Cafe',
    hours: { monday: '9 AM - 5 PM' },
    menuHighlights: ['coffee', 'matcha', 'lunch sets'],
  },
});

export async function handleTelegramWebhook(update) {
  const result = await telegram.handleUpdate(update);
  if (!result) return { ok: true };

  await sendTelegramMessage({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    ...result.reply,
  });

  return { ok: true, provider: result.provider };
}
```

This repo includes the reusable adapter only. Production apps should still verify webhook secrets, rate limit users, store audit logs, and keep bot tokens outside the repo.

## Basic Front Desk Tools

```js
import { createCheckHoursTool, createHandoffTool } from '@melliai/core';

const tools = [
  createCheckHoursTool({
    monday: '9 AM - 5 PM',
    tuesday: '9 AM - 5 PM',
    default: 'Please check with the team.',
  }),
  createHandoffTool(async (input, context) => {
    await context.queue.create({
      name: input.name,
      contact: input.contact,
      request: input.request,
      urgency: input.urgency || 'normal',
    });

    return { status: 'queued' };
  }),
];
```

Tools are contracts. Your app decides when a model-requested tool call is trusted enough to execute.

## Direct Chat

```js
const result = await core.chat({
  messages: [
    { role: 'system', content: 'You are MELLI, a customer-specific AI front desk.' },
    { role: 'user', content: 'Can I book a table for tonight?' },
  ],
});

console.log(result.provider);
console.log(result.content);
```

## Ollama

```bash
ollama serve
ollama pull llama3.1
```

```js
const ollama = createOllamaProvider({
  model: 'llama3.1',
  baseUrl: 'http://localhost:11434',
});
```

By default, remote public Ollama URLs are blocked. Allowed by default:

- `localhost`
- `127.0.0.1`
- `.local`
- private IPv4 ranges

Use `allowRemote: true` only for deployments you control.

## OpenAI-Compatible Providers

```js
const agnes = createOpenAICompatibleProvider({
  name: 'agnes',
  model: 'agnes-2.0-flash',
  baseUrl: 'https://apihub.agnes-ai.com/v1',
  apiKey: process.env.AGNES_API_KEY,
});
```

## Tools

```js
import { createTool } from '@melliai/core';

const checkHours = createTool({
  name: 'check_hours',
  description: 'Check business hours.',
  schema: {
    type: 'object',
    properties: {
      date: { type: 'string' },
    },
    required: ['date'],
  },
  async execute(input, context) {
    return context.business.hours[input.date] || 'closed';
  },
});
```

Production apps should enforce permissions, validation, audit logs, and customer ownership before executing tools.

## Public Boundary

Do not put these in this repo:

- API keys
- `.env` files
- customer records
- private prompts
- production database access
- billing code
- private webhook routes

## License

MIT. See `LICENSE`.
