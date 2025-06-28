/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sla_definitions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.enum('priority', ['low', 'medium', 'high', 'critical']).notNullable();
    table.enum('ticket_type', ['incident', 'request', 'problem', 'change']).notNullable();
    table.integer('response_time_hours').notNullable(); // Time to first response
    table.integer('resolution_time_hours').notNullable(); // Time to resolution
    table.integer('business_hours_start').defaultTo(9); // 9 AM
    table.integer('business_hours_end').defaultTo(17); // 5 PM
    table.jsonb('business_days').defaultTo('[1,2,3,4,5]'); // Monday to Friday
    table.jsonb('holidays').defaultTo('[]'); // Array of holiday dates
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['priority']);
    table.index(['ticket_type']);
    table.index(['is_active']);
    
    // Unique constraint to prevent duplicate SLA definitions
    table.unique(['organization_id', 'priority', 'ticket_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sla_definitions');
}; 