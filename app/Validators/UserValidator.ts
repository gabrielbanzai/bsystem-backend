import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator'

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UserValidator {
  constructor(protected ctx: HttpContextContract) {}

  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string([ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string([
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    name: schema.string({}, [
      rules.required(),
      rules.minLength(3),
      rules.maxLength(100)
    ]),
    email: schema.string({}, [
      rules.required(),
      rules.email(),
      rules.minLength(3),
      rules.maxLength(150)
    ]),
    cpf: schema.string({}, [
      rules.minLength(1),
      rules.maxLength(11)
    ]),
    phone: schema.string({}, [
      rules.minLength(1),
      rules.maxLength(11)
    ]),
    permissions: schema.array().members(schema.number([rules.nullable()]))
  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages: CustomMessages = {
    'name.required': 'Nome do usuário é obrigatório.',
    'name.minLength': 'Nome do usuário não pode conter menos de 3 caracteres.',
    'name.maxLength': 'Nome do usuário não pode conter mais de 100 caracteres.',
    'email.required': 'E-mail do usuário é obrigatório.',
    'email.minLength': 'Nome do usuário não pode conter menos de 3 caracteres.',
    'email.maxLength': 'Nome do usuário não pode conter mais de 150 caracteres.',
    'permissions.*.number': 'Permissões em formato inválido.',
    'department_id.exists': 'Departamento informado não existe na base de dados.',
    'position_id.exists': 'Cargo informado não existe na base de dados.',
  }
}
