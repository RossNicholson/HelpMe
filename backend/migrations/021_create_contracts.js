/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('contracts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('client_id').notNullable();
    table.string('contract_number').notNullable();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('type').notNullable(); // 'managed_services', 'project_based', 'time_and_materials', 'retainer'
    table.decimal('monthly_rate', 12, 2).nullable();
    table.decimal('hourly_rate', 10, 2).nullable();
    table.integer('hours_per_month').nullable();
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.string('status').notNullable().defaultTo('active'); // 'active', 'expired', 'terminated', 'draft'
    table.json('terms_and_conditions').nullable();
    table.json('service_levels').nullable();
    table.json('billing_terms').nullable();
    table.boolean('auto_renew').defaultTo(false);
    table.integer('renewal_period_months').nullable();
    table.decimal('early_termination_fee', 12, 2).nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.unique(['contract_number']);
    table.index(['organization_id', 'client_id']);
    table.index(['status']);
    table.index(['start_date', 'end_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('contracts');
}; 