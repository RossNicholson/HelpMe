/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('billing_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE'); // Null for default rates
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE'); // Null for default rates
    table.string('rate_name').notNullable(); // e.g., "Standard Rate", "Emergency Rate", "After Hours"
    table.decimal('hourly_rate', 10, 2).notNullable();
    table.enum('rate_type', ['default', 'user_specific', 'client_specific', 'service_specific']).defaultTo('default');
    table.enum('service_type', ['incident', 'request', 'problem', 'change', 'maintenance', 'consultation']).defaultTo('incident');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('effective_date').defaultTo(knex.fn.now());
    table.timestamp('expiry_date'); // Null for ongoing rates
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['user_id']);
    table.index(['client_id']);
    table.index(['rate_type']);
    table.index(['service_type']);
    table.index(['is_active']);
    table.index(['effective_date']);
    
    // Unique constraint to prevent duplicate rates
    table.unique(['organization_id', 'user_id', 'client_id', 'rate_name', 'service_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('billing_rates');
}; 