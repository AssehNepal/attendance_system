---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>.controller.ts"
unless_exists: true
skip_if: <%= !blocks.includes('Controller') %>
---
<%
function toPascalCase(str) {
  return str.replace(/(^|_|\-)(\w)/g, (_, __, c) => c.toUpperCase());
}

function toCamelCase(str) {
  return str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
            .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toFileName(str) {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '').toLowerCase();
}

function pluralize(str) {
  const endings = {
    'y': 'ies',
    's': 'ses',
    'x': 'xes',
    'z': 'zes',
    'ch': 'ches',
    'sh': 'shes'
  };
  for (const [ending, replacement] of Object.entries(endings)) {
    if (str.endsWith(ending)) {
      return str.slice(0, -ending.length) + replacement;
    }
  }
  return str + 's';
}
const ClassName = toPascalCase(name);
const fileName = toFileName(name);
const ControllerName = `${ClassName}Controller`;
const ServiceName = `${ClassName}Service`;
const serviceName = toCamelCase(ServiceName);
const createFunctionName = `create`;
const updateFunctionName = `update`;
const deleteFunctionName = `delete`;
const getAllFunctionName = `getAll`;
const getSingleFunctionName = `getSingle`;
const CreateDtoName = `Create${ClassName}Dto`;
const createDtoName = toCamelCase(CreateDtoName);
const UpdateDtoName = `Update${ClassName}Dto`;
const updateDtoName = toCamelCase(UpdateDtoName);
const PageOptionsDtoName = `PageOptions${ClassName}Dto`;
const pageOptionsDtoName = toCamelCase(PageOptionsDtoName);
const DtoName = `${ClassName}Dto`;
const createDtoFileName = `create-${fileName}.dto`;
const dtoFileName = `${fileName}.dto`;
const pageOptionsDtoFileName = `page-options-${fileName}.dto`;
const updateDtoFileName = `update-${fileName}.dto`;
const serviceFileName = `${fileName}.service`;
%>
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PageDto } from '../../common/dto/page.dto.ts';
import { Auth } from '../../decorators/http.decorators';
import { <%= CreateDtoName %> } from './dtos/<%= createDtoFileName %>.ts';
import type { <%= DtoName %> } from './dtos/<%= dtoFileName %>.ts';
import { <%= PageOptionsDtoName %> } from './dtos/<%= pageOptionsDtoFileName %>.ts';
import { <%= UpdateDtoName %> } from './dtos/<%= updateDtoFileName %>.ts';
import { <%= ServiceName %> } from './<%= serviceFileName %>.ts';

@Controller('<%= pluralize(fileName) %>')
@ApiTags('<%= pluralize(fileName) %>')
export class <%= ControllerName %> {
  constructor(private <%= serviceName %>: <%= ServiceName %>) {}

  @Post()
  @Auth([])
  @HttpCode(HttpStatus.CREATED)
  async <%= createFunctionName %>(@Body() <%= createDtoName %>: <%= CreateDtoName %>) {
    const entity = await this.<%= serviceName %>.<%= createFunctionName %>(<%= createDtoName %>);
    return entity.toDto();
  }

  @Get()
  @Auth([])
  @HttpCode(HttpStatus.OK)
  <%= getAllFunctionName %>(@Query() <%= pageOptionsDtoName %>: <%= PageOptionsDtoName %>){
    return this.<%= serviceName %>.<%= getAllFunctionName %>(<%= pageOptionsDtoName %>);
  }

  @Get(':id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  async <%= getSingleFunctionName %>(@Param('id') id: string): Promise<<%= DtoName %>> {
    const entity = await this.<%= serviceName %>.<%= getSingleFunctionName %>(id as Uuid);
    return entity.toDto();
  }

  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  <%= updateFunctionName %>(
    @Param('id') id: string,
    @Body() <%= updateDtoName %>: <%= UpdateDtoName %>,
  ): Promise<void> {
    return this.<%= serviceName %>.<%= updateFunctionName %>(id as Uuid, <%= updateDtoName %>);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async <%= deleteFunctionName %>(@Param('id') id: string): Promise<void> {
    await this.<%= serviceName %>.<%= deleteFunctionName %>(id as Uuid);
  }
}