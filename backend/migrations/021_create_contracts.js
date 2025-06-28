/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('contracts', (table) => {
    table.increments('id').primary();
    table.integer('organization_id').unsigned().notNullable();
    table.integer('client_id').unsigned().notNullable();
    table.string('contract_number').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['managed_services', 'project_based', 'hourly', 'retainer', 'break_fix']).notNullable();
    table.enum('status', ['draft', 'active', 'expired', 'terminated', 'renewed']).defaultTo('draft');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('monthly_value', 10, 2).defaultTo(0);
    table.decimal('hourly_rate', 10, 2).defaultTo(0);
    table.integer('included_hours').defaultTo(0);
    table.json('service_levels').comment('JSON object defining SLA terms');
    table.json('billing_terms').comment('JSON object defining billing terms');
    table.json('scope_of_work').comment('JSON object defining services included');
    table.text('terms_and_conditions');
    table.text('notes');
    table.integer('created_by').unsigned().notNullable();
    table.integer('updated_by').unsigned();
    table.timestamps(true, true);

    // Foreign key constraints
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['contract_number']);
    table.index(['status']);
    table.index(['start_date', 'end_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('contracts');
}; 