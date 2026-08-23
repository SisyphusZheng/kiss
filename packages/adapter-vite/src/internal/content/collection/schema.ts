import type {
  CollectionFieldDefinition,
  CollectionFieldType,
  CollectionSchema,
  CollectionSchemaContext,
  CollectionSchemaResult,
} from './types.ts';

function definition(
  value: CollectionFieldType | CollectionFieldDefinition,
): CollectionFieldDefinition {
  return typeof value === 'string' ? { type: value } : value;
}

function matchesType(value: unknown, type: CollectionFieldType): boolean {
  if (type === 'string[]') {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
  if (type === 'string') return typeof value === 'string';
  if (type === 'number') return typeof value === 'number';
  return typeof value === 'boolean';
}

export function validateCollectionFrontmatter(
  schema: CollectionSchema | undefined,
  input: Record<string, unknown>,
  context: CollectionSchemaContext,
): CollectionSchemaResult {
  if (!schema) return { frontmatter: input };

  const frontmatter: Record<string, unknown> = {};
  for (const [name, rawDefinition] of Object.entries(schema.fields)) {
    const field = definition(rawDefinition);
    let value = input[name];
    if (value === undefined && field.default !== undefined) value = field.default;
    if (value === undefined) {
      if (field.required) {
        throw new Error(
          `[content:${context.collection}] ${context.fileName}: frontmatter.${name} is required`,
        );
      }
      continue;
    }
    // YAML parsers commonly materialize unquoted ISO dates as Date objects;
    // collection schemas expose stable JSON/string data to generated modules.
    if (field.type === 'string' && value instanceof Date) {
      value = value.toISOString().split('T')[0];
    }
    if (!matchesType(value, field.type)) {
      throw new Error(
        `[content:${context.collection}] ${context.fileName}: frontmatter.${name} must be ${field.type}`,
      );
    }
    frontmatter[name] = value;
  }
  return schema.transform?.(frontmatter, context) ?? { frontmatter };
}

export function collectionFieldTypeScript(
  value: CollectionFieldType | CollectionFieldDefinition,
): { type: string; optional: boolean } {
  const field = definition(value);
  const type = field.type === 'string[]' ? 'string[]' : field.type;
  return { type, optional: !field.required && field.default === undefined };
}
