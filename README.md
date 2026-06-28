# MELLI Core

Public-safe core building blocks for MELLI AI.

This repository intentionally contains only reusable core logic:

- Provider routing
- Local Ollama support
- OpenAI-compatible provider support, including Agnes-style APIs
- Basic tool contracts
- NFC/QR tag context helpers

It does not contain customer data, production routes, billing code, private prompts, API keys, or deployment configuration.

## Quick Start

```js
import {
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

const result = await core.chat({
  messages: [
    { role: 'system', content: 'You are MELLI, a customer-specific AI front desk.' },
    { role: 'user', content: 'Do you take reservations tonight?' },
  ],
});

console.log(result.content);
```

## Ollama

Ollama is treated as a local provider. By default, the adapter only allows local or private network URLs:

- `localhost`
- `127.0.0.1`
- `.local`
- RFC1918 private IPv4 ranges

Remote public URLs are blocked unless `allowRemote: true` is explicitly passed. This avoids turning customer-controlled provider configuration into an SSRF path.

```js
createOllamaProvider({
  model: 'llama3.1',
  baseUrl: 'http://localhost:11434',
});
```

## NFC / QR Tags

MELLI physical tags should store short URLs such as `/t/{tagId}`. The application resolves that tag into customer-specific context:

```js
{
  customerId: 'richmond-sushi',
  location: 'front_counter',
  action: 'ask_ai',
  source: 'nfc'
}
```

The tag itself should not store private customer payloads.

## Public Boundary

Keep private code out of this package:

- No API keys or environment files
- No raw customer data
- No production database access
- No private business routes
- No provider-specific secrets


