'use strict'

module.exports = {
  prompt: ({ prompter, args }) => {
    return prompter.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Name:',
        validate(value) {
          if (!value.length) {
            return 'Module must have a name.';
          }
          return true;
        },
      },
      {
        type: 'MultiSelect',
        name: 'blocks',
        message: 'Blocks:',
        initial: [
          'Controller',
          'CreateCommand',
          'CreateDTO',
          'DTO',
          'Entity',
          'Module',
          'NotFoundException',
          'PageOptionsDTO',
          'Service',
          'UpdateDTO'
        ],
        choices: [
          {
            name: 'Controller',
            value: 'controller',
          },
          {
            name: 'CreateCommand',
            value: 'create-command',
          },
          {
            name: 'CreateDTO',
            value: 'create-dto',
          },
          {
            name: 'DTO',
            value: 'dto',
          },
          {
            name: 'Entity',
            value: 'entity',
          },
          {
            name: 'NotFoundException',
            value: 'not-found-exception',
          },
          {
            name: 'PageOptionsDTO',
            value: 'page-options-dto',
          },
          {
            name: 'Service',
            value: 'service',
          },
          {
            name: 'UpdateDTO',
            value: 'update-dto',
          },
          {
            name: 'Module',
            value: 'module',
          }
        ],
      }
    ])
    .then(answer => {
      //// For debugging
      // console.log(answer)
      return answer;
    })
  }
} 