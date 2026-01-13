---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/exceptions/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>-not-found.exception.ts"
unless_exists: true
---
<%
// Calculate variables for template body
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const exceptionName = `${className}NotFoundException`;
%>
import { NotFoundException } from '@nestjs/common';

export class <%= exceptionName %> extends NotFoundException {
  constructor() {
    super('<%= className %> not found');
  }
}