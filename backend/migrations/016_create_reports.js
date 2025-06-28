/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['ticket_analytics', 'time_tracking', 'client_performance', 'sla_compliance', 'billing', 'custom']).notNullable();
    table.jsonb('filters').defaultTo('{}'); // Date ranges, status filters, etc.
    table.jsonb('chart_config').defaultTo('{}'); // Chart type, metrics, etc.
    table.jsonb('schedule').defaultTo('{}'); // Cron expression, recipients, etc.
    table.boolean('is_scheduled').defaultTo(false);
    table.boolean('is_public').defaultTo(false); // Share with organization
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_generated');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['created_by']);
    table.index(['type']);
    table.index(['is_scheduled']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('reports');
}; 