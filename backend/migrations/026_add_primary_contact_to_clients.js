/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('clients', (table) => {
    // Add primary_contact_id field that references a user
    table.uuid('primary_contact_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Add index for performance
    table.index(['primary_contact_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('clients', (table) => {
    table.dropIndex(['primary_contact_id']);
    table.dropColumn('primary_contact_id');
  });
}; 