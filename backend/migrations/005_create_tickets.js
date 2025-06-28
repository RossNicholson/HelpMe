/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.string('ticket_number').unique().notNullable();
    table.string('subject').notNullable();
    table.text('description').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.enum('status', ['open', 'in_progress', 'waiting_on_client', 'waiting_on_third_party', 'resolved', 'closed']).defaultTo('open');
    table.enum('type', ['incident', 'request', 'problem', 'change']).defaultTo('incident');
    table.enum('source', ['email', 'phone', 'portal', 'chat', 'api']).defaultTo('portal');
    table.jsonb('sla_details');
    table.timestamp('due_date');
    table.timestamp('resolved_at');
    table.timestamp('closed_at');
    table.integer('time_spent_minutes').defaultTo(0);
    table.jsonb('tags').defaultTo('[]');
    table.jsonb('custom_fields').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['client_id']);
    table.index(['created_by']);
    table.index(['assigned_to']);
    table.index(['ticket_number']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['type']);
    table.index(['due_date']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tickets');
}; 