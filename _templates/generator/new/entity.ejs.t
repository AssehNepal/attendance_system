---
to: "src/modules/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') %>/<%= name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + '.entity' %>.ts"
unless_exists: true
---
<%
const className = name.replace(/(^|_|\-)(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
const fileName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
const entityName = `${className}Entity`;
const tableName = name.toLowerCase().replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '') + 's';
const DtoName = `${className}Dto`;
const dtoFileName = `${fileName}.dto`;
%>
import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { <%= DtoName %>} from './dtos/<%=dtoFileName%>.ts'

@Entity({ name: '<%= tableName %>' })
@UseDto(<%=DtoName%>)
export class <%= entityName %> extends AbstractEntity<<%= DtoName%>> {

  @Column({ nullable: false })
  name!: string;
}