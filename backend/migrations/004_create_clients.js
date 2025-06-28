/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('clients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('company_name');
    table.string('email');
    table.string('phone');
    table.string('website');
    table.jsonb('address');
    table.string('timezone').defaultTo('UTC');
    table.enum('status', ['active', 'inactive', 'prospect']).defaultTo('active');
    table.jsonb('contract_details');
    table.decimal('hourly_rate', 10, 2);
    table.text('notes');
    table.jsonb('custom_fields').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['status']);
    table.index(['is_active']);
    table.index(['email']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('clients');
}; 