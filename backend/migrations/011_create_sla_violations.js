/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sla_violations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ticket_id').notNullable().references('id').inTable('tickets').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.enum('violation_type', ['response_time', 'resolution_time', 'escalation']).notNullable();
    table.timestamp('expected_time').notNullable(); // When the SLA should have been met
    table.timestamp('actual_time'); // When it was actually met (null if still violated)
    table.integer('violation_minutes').notNullable(); // How many minutes the SLA was violated by
    table.jsonb('sla_details').defaultTo('{}'); // Details of the SLA that was violated
    table.boolean('is_resolved').defaultTo(false);
    table.timestamp('resolved_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['ticket_id']);
    table.index(['organization_id']);
    table.index(['violation_type']);
    table.index(['is_resolved']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sla_violations');
}; 