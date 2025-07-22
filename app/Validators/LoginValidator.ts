import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class LoginValidator {
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
    email: schema.string({}, [
      rules.required(), 
      rules.email(), 
      rules.minLength(3), 
      rules.maxLength(100)
    ]),
    password: schema.string({}, [
      rules.required(), 
      rules.minLength(6), 
      rules.maxLength(30)
    ])
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
    'email.required': 'E-mail obrigatório.',
    'email.email': 'E-mail inválido.',
    'email.minLength': 'E-mail não pode conter menos de 3 caracteres.',
    'email.maxLength': 'E-mail não pode conter mais de 100 caracteres.',
    'password.required': 'Senha obrigatória.',
    'password.minLength': 'Senha não pode conter menos de 6 caracteres.',
    'password.maxLength': 'Senha não pode conter mais de 30 caracteres.',
  }
}
