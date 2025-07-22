declare module '@ioc:Adonis/Core/Validator' {
    interface Rules {
      exists(args: any[]): Rule
    }
}