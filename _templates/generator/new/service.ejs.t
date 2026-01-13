---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>.service.ts"
unless_exists: true
---
<%

function toCamelCase(str) {
  return str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
            .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

// Calculate all required variables
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const fileName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
const serviceName = `${className}Service`;
const entityName = `${className}Entity`;
const createDtoName = `Create${className}Dto`;
const updateDtoName = `Update${className}Dto`;
const entityFileName = `${fileName}.entity`;
const createDtoFileName = `create-${fileName}.dto`;
const updateDtoFileName = `update-${fileName}.dto`;
const PageOptionsDtoName = `PageOptions${className}Dto`;
const pageOptionsDtoFileName = `page-options-${fileName}.dto`;
const pageOptionsDtoName = toCamelCase(PageOptionsDtoName);

%>
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { <%= entityName %> } from './<%= entityFileName %>.ts';
import type { <%= createDtoName %> } from './dtos/<%= createDtoFileName %>.ts';
import type { <%= updateDtoName %> } from './dtos/<%= updateDtoFileName %>.ts';
import { <%= PageOptionsDtoName %> } from './dtos/<%= pageOptionsDtoFileName %>.ts';


@Injectable()
export class <%= serviceName %> {
  constructor(
    @InjectRepository(<%= entityName %>)
    private readonly repo: Repository<<%= entityName %>>,
  ) {}

  async create(createDto: <%= createDtoName %>): Promise<<%= entityName %>> {
    const entity = this.repo.create(createDto);
    return this.repo.save(entity);
  }

  async getAll(<%=pageOptionsDtoName%>:<%= PageOptionsDtoName %>){
    return this.repo.find();
  }

  async getSingle(id: string): Promise<<%= entityName %>> {
    const entity = await this.repo.findOneBy({ id: id as Uuid });
    if (!entity) throw new NotFoundException();
    return entity;
  }

  async update(id: string, updateDto: <%= updateDtoName %>): Promise<void> {
    await this.repo.update(id, updateDto);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}