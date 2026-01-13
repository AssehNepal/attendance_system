---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + '.module' %>.ts"
unless_exists: true
---
<%
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const fileName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
const moduleName = `${className}Module`;
const controllerName = `${className}Controller`;
const serviceName = `${className}Service`;
const entityName = `${className}Entity`;
const createHandlerName = `Create${className}Handler`;
const createCommandFileName = `create-${fileName}.command`;
const controllerFileName = `${fileName}.controller`;
const entityFileName = `${fileName}.entity`;
const serviceFileName = `${fileName}.service`;

const handlers = [createHandlerName];
%>
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { <%= createHandlerName %> } from './commands/<%= createCommandFileName %>.ts';
import { <%= controllerName %> } from './<%= controllerFileName %>.ts';
import { <%= entityName %> } from './<%= entityFileName %>.ts';
import { <%= serviceName %> } from './<%= serviceFileName %>.ts';


@Module({
  imports: [
    TypeOrmModule.forFeature([<%= entityName %>]),
  ],
  providers: [<%= serviceName %>, <%= handlers.join(', ') %>],
  controllers: [<%= controllerName %>],
})
export class <%= moduleName %> {}