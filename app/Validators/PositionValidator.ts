import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PositionValidator {
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
    department_id: schema.number([
      rules.exists(['departments', 'id'])
    ]),
    permissions: schema.array().members(schema.number())
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
    'name.required': 'Nome do departamento é obrigatório.',
    'name.minLength': 'Nome do departamento não pode conter menos de 3 caracteres.',
    'name.maxLength': 'Nome do departamento não pode conter mais de 100 caracteres.',
    'permissions.required': 'É obrigatório informar as permissões.',
    'permissions.*.number': 'Permissões em formato inválido.',
    'department_id.exists': 'Departamento informado não existe na base de dados.',
  }
}
