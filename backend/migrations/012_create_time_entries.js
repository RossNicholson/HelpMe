/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('time_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ticket_id').notNullable().references('id').inTable('tickets').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.text('description').notNullable();
    table.integer('minutes_spent').notNullable();
    table.decimal('billable_rate', 10, 2).defaultTo(0); // Hourly rate for billing
    table.boolean('is_billable').defaultTo(true);
    table.enum('activity_type', ['work', 'research', 'meeting', 'travel', 'other']).defaultTo('work');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.jsonb('metadata').defaultTo('{}'); // Additional data like location, device, etc.
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['ticket_id']);
    table.index(['user_id']);
    table.index(['organization_id']);
    table.index(['start_time']);
    table.index(['end_time']);
    table.index(['is_billable']);
    table.index(['activity_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('time_entries');
}; 