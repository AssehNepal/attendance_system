---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/dtos/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + '.dto' %>.ts"
unless_exists: true
---
<%
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const fileName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
const dtoName = `${className}Dto`;
const entityName = `${className}Entity`;
const entityFileName = `${fileName}.entity`;

%>
import { AbstractDto } from "../../../common/dto/abstract.dto.ts";
import { <%= entityName %> } from '../<%= entityFileName %>.ts';


export class <%= dtoName %> extends AbstractDto {
  name!: string;
}