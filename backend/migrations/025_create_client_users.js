/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('client_users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.enum('role', ['primary_contact', 'secondary_contact', 'billing_contact', 'technical_contact', 'end_user']).defaultTo('end_user');
    table.boolean('is_active').defaultTo(true);
    table.boolean('can_create_tickets').defaultTo(true);
    table.boolean('can_view_all_tickets').defaultTo(false);
    table.jsonb('permissions').defaultTo('{}');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint - a user can only be associated with a client once
    table.unique(['user_id', 'client_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['client_id']);
    table.index(['organization_id']);
    table.index(['role']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('client_users');
}; 