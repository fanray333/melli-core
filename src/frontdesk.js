import { createTool } from './tools.js';

function compactList(values) {
  return values.filter(Boolean).join('\n');
}

export function createFrontDeskSystemPrompt(options = {}) {
  const businessName = options.businessName || 'the business';
  const voice = options.voice || 'warm, concise, and practical';
  const capabilities = options.capabilities || [
    'answer common customer questions',
    'check business hours',
    'explain menu or service highlights',
    'collect handoff details when a human should follow up',
  ];

  return compactList([
    `You are MELLI, the AI front desk for ${businessName}.`,
    `Use a ${voice} voice.`,
    'Stay customer-specific. Do not invent policies, prices, availability, or bookings.',
    `You can: ${capabilities.join('; ')}.`,
    'If the request needs a human, collect the customer name, contact, request, and urgency.',
  ]);
}

export function createBusinessContext(options = {}) {
  const sections = [];

  if (options.businessName) sections.push(`Business: ${options.businessName}`);
  if (options.location) sections.push(`Location: ${options.location}`);
  if (options.hours) sections.push(`Hours: ${JSON.stringify(options.hours)}`);
  if (options.menuHighlights) sections.push(`Highlights: ${options.menuHighlights.join(', ')}`);
  if (options.policies) sections.push(`Policies: ${options.policies.join('; ')}`);

  return sections.join('\n');
}

export function createCheckHoursTool(hours = {}) {
  return createTool({
    name: 'check_hours',
    description: 'Check public business hours for a date or weekday.',
    schema: {
      type: 'object',
      properties: {
        day: { type: 'string', description: 'Weekday or date requested by the customer.' },
      },
      required: ['day'],
    },
    async execute(input) {
      const key = String(input?.day || '').toLowerCase();
      return hours[key] || hours.default || 'Hours are not available.';
    },
  });
}

export function createHandoffTool(handler) {
  return createTool({
    name: 'request_handoff',
    description: 'Create a human follow-up request.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        contact: { type: 'string' },
        request: { type: 'string' },
        urgency: { type: 'string', enum: ['low', 'normal', 'high'] },
      },
      required: ['request'],
    },
    async execute(input, context) {
      if (typeof handler === 'function') {
        return handler(input, context);
      }

      return {
        status: 'queued',
        request: input?.request || '',
        urgency: input?.urgency || 'normal',
      };
    },
  });
}
