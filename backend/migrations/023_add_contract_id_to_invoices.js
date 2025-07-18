/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('invoices', (table) => {
    table.uuid('contract_id').nullable();
    table.foreign('contract_id').references('id').inTable('contracts').onDelete('SET NULL');
    table.index(['contract_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('invoices', (table) => {
    table.dropForeign(['contract_id']);
    table.dropIndex(['contract_id']);
    table.dropColumn('contract_id');
  });
}; 