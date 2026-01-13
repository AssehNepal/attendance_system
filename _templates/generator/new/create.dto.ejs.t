---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/dtos/<%= 'create-' + name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + '.dto' %>.ts"
unless_exists: true
---
<%
// Calculate variables for template body
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const createDtoName = `Create${className}Dto`;
%>
export class <%= createDtoName %> {
  name!: string;
}