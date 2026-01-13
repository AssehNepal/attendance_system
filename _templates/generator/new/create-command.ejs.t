---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/commands/<%= 'create-' + name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + '.command' %>.ts"
unless_exists: true
---
<%
function toPascalCase(str) {
  return str.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
}

const className = toPascalCase(name);
const fileName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
const createCommandName = `Create${className}Command`;
const createHandlerName = `Create${className}Handler`;
const createDtoName = `Create${className}Dto`;
const createDtoFileName = `create-${fileName}.dto`;
const entityName = `${className}Entity`;
const entityFileName = `${fileName}.entity`;
const serviceName = `${className}Service`;
const serviceFileName = `${fileName}.service`;
%>
import type { ICommandHandler } from '@nestjs/cqrs';
import {CommandHandler} from '@nestjs/cqrs';
import { <%= createDtoName %> } from '../dtos/<%= createDtoFileName %>.ts';
import { <%= entityName %> } from '../<%= entityFileName %>.ts';
import { <%= serviceName %> } from '../<%= serviceFileName %>.ts';

export class <%= createCommandName %> {
  constructor(public readonly dto: <%= createDtoName %>) {}
}

@CommandHandler(<%= createCommandName %>)
export class <%= createHandlerName %> implements ICommandHandler<<%= createCommandName %>> {
  constructor(private readonly service: <%= serviceName %>) {}

  async execute(command: <%= createCommandName %>): Promise<<%= entityName %>> {
    return this.service.create(command.dto);
  }
}