/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.uuid('organization_id').notNullable();
    table.uuid('user_id').nullable();
    table.string('action').notNullable().comment('CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.');
    table.string('entity_type').notNullable().comment('tickets, contracts, clients, users, etc.');
    table.uuid('entity_id').nullable().comment('ID of the affected record');
    table.string('entity_name').nullable().comment('Human-readable name of the entity');
    table.json('old_values').nullable().comment('Previous values before change');
    table.json('new_values').nullable().comment('New values after change');
    table.json('metadata').nullable().comment('Additional context data');
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.string('session_id').nullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('low');
    table.text('description').nullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');

    // Indexes for performance
    table.index(['organization_id', 'timestamp']);
    table.index(['user_id', 'timestamp']);
    table.index(['entity_type', 'entity_id']);
    table.index(['action', 'entity_type']);
    table.index(['severity', 'timestamp']);
    table.index(['timestamp']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
}; 