/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('clients', (table) => {
    // Add primary contact fields
    table.string('primary_contact_first_name');
    table.string('primary_contact_last_name');
    table.string('primary_contact_email');
    table.string('primary_contact_phone');
    
    // Add indexes for performance
    table.index(['primary_contact_email']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('clients', (table) => {
    table.dropIndex(['primary_contact_email']);
    table.dropColumn('primary_contact_first_name');
    table.dropColumn('primary_contact_last_name');
    table.dropColumn('primary_contact_email');
    table.dropColumn('primary_contact_phone');
  });
}; 