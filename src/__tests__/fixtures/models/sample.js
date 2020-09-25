/* istanbul ignore file */
module.exports = function () {
  return {
    name: 'sample',
    summary: 'Sample model in module format',
    entities: [
      {
        name: 'Person',
      },
      {
        name: 'BankAccount',
      },
    ],
  };
};
