/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('knowledge_base', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.string('slug').unique().notNullable();
    table.enum('type', ['article', 'how_to', 'troubleshooting', 'faq', 'policy']).defaultTo('article');
    table.enum('visibility', ['public', 'internal', 'client']).defaultTo('internal');
    table.jsonb('tags').defaultTo('[]');
    table.jsonb('categories').defaultTo('[]');
    table.integer('view_count').defaultTo(0);
    table.boolean('is_published').defaultTo(false);
    table.boolean('is_featured').defaultTo(false);
    table.jsonb('attachments').defaultTo('[]');
    table.jsonb('meta_data').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['created_by']);
    table.index(['slug']);
    table.index(['type']);
    table.index(['visibility']);
    table.index(['is_published']);
    table.index(['is_featured']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('knowledge_base');
}; 