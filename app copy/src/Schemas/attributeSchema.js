// src/Schemas/attributeSchema.js

export const attributeSchema = {
  title: 'Attribute',
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: {
      type: 'string',
      title: 'Attribute Name',
      default: '',
    },
    type: {
      type: 'string',
      title: 'Type',
      enum: ['string', 'number', 'boolean', 'object', 'array'],
    },
  },
  allOf: [
    {
      if: {
        properties: { type: { const: 'object' } },
        required: ['type'],
      },
      then: {
        properties: {
          properties: {
            type: 'array',
            title: 'Nested Properties',
            description: 'Define properties if type is object.',
            items: { $ref: '#' },
          },
        },
        required: ['properties'],
      },
    },
    {
      if: {
        properties: { type: { const: 'array' } },
        required: ['type'],
      },
      then: {
        properties: {
          items: {
            type: 'array',
            title: 'Items Schema',
            description: 'Define items if type is array.',
            items: { $ref: '#' },
          },
        },
        required: ['items'],
      },
    },
    {
      else: {
        properties: {
          properties: {
            not: {},
          },
          items: {
            not: {},
          },
        },
      },
    },
  ],
};

export const outputAttributeSchema = {
  ...attributeSchema,
  title: 'Output Attribute',
  properties: {
    ...attributeSchema.properties,
    desiredProperties: {
      type: 'array',
      title: 'Metrics',
      metrics: 'Describe metrics.',
      items: {
        type: 'string',
        title: 'Property',
        default: '',
      },
    },
  },
  allOf: attributeSchema.allOf,
};
