import { LanguageCode } from '../../constants/language-code.ts';
import { StringField } from '../../decorators/field.decorators.ts';

export class CreateTranslationDto {
  @StringField()
  languageCode!: LanguageCode;

  @StringField()
  text!: string;
}
