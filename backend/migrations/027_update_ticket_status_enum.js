/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE tickets 
    DROP CONSTRAINT IF EXISTS tickets_status_check;
  `)
  .then(() => {
    // Update existing status values to new ones
    return knex('tickets')
      .where('status', 'open')
      .update({ status: 'unassigned' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'waiting_on_client')
      .update({ status: 'in_progress' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'waiting_on_third_party')
      .update({ status: 'in_progress' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'resolved')
      .update({ status: 'closed' });
  })
  .then(() => {
    // Add the new constraint
    return knex.raw(`
      ALTER TABLE tickets 
      ADD CONSTRAINT tickets_status_check 
      CHECK (status IN ('unassigned', 'assigned', 'in_progress', 'closed'));
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE tickets 
    DROP CONSTRAINT IF EXISTS tickets_status_check;
  `)
  .then(() => {
    // Revert status values back to old ones
    return knex('tickets')
      .where('status', 'unassigned')
      .update({ status: 'open' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'assigned')
      .update({ status: 'open' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'in_progress')
      .update({ status: 'in_progress' });
  })
  .then(() => {
    return knex('tickets')
      .where('status', 'closed')
      .update({ status: 'resolved' });
  })
  .then(() => {
    // Recreate the old constraint
    return knex.raw(`
      ALTER TABLE tickets 
      ADD CONSTRAINT tickets_status_check 
      CHECK (status IN ('open', 'in_progress', 'waiting_on_client', 'waiting_on_third_party', 'resolved', 'closed'));
    `);
  });
}; 