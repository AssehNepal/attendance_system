---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/dtos/page-options-<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>.dto.ts"
unless_exists: true
---
<%
// Calculate variables for template body
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const pageOptionsDtoName = `PageOptions${className}Dto`;
%>
import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';

export class <%= pageOptionsDtoName %> extends PageOptionsDto{
}