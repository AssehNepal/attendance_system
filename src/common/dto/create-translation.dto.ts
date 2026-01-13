import { StringField } from '../../decorators/field.decorators.ts';
import { LanguageCode } from '../../constants/language-code.ts';

export class CreateTranslationDto {
  @StringField()
  languageCode!: LanguageCode;

  @StringField()
  text!: string;
}
