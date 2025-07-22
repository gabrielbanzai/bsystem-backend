import { str_random } from "App/Helpers"
import Bull from '@ioc:Rocketseat/Bull'
import Job from 'App/Jobs/SendResetPassword'
import { parseISO, format, addSeconds } from "date-fns"

class AuthService {
    async loginAttempt(email, password, auth){

      let attempt = await auth.attempt(email, password)

      return attempt
    }

    async loadUserPermissions(user: any): Promise<any[]>{
      let permissions: any[] = []

      let department, position

      if(user.department_id){
        department = await user.related('department').query()
      }

      if(user.position_id){
        position = await user.related('position').query()
      }

      let dep_permissions, pos_permissions, user_permissions

      //Carregando permissões do departamento
      if(department){
        dep_permissions = await department[0].related('permissions').query()
        dep_permissions = await this.convertProxyArrayToJson(dep_permissions)
        permissions = await this.miscArray(permissions, dep_permissions)
      }

      if(position){
        pos_permissions = await position[0].related('permissions').query()
        pos_permissions = await this.convertProxyArrayToJson(pos_permissions)
        permissions = await this.miscArray(permissions, pos_permissions)
      }

      user_permissions = await user.related('permissions').query()
      user_permissions = await this.convertProxyArrayToJson(user_permissions)
      permissions = await this.miscArray(permissions, user_permissions)

      return permissions
    }

    async resetPassword(user: any){
      let newPass = await str_random(8)

      user.merge({password: newPass})

      await user.save()

      let date = parseISO(format(addSeconds(new Date(), 10), 'yyyy-MM-dd HH:mm:ss'))

      await Bull.schedule(new Job().key, {user, newPass}, date, { removeOnComplete: true })
    }

    async validateUserPermissons(user: any, permissons: string[]){

      let validate = false
      if(permissons.length > 0){
        let user_permissions = (await this.loadUserPermissions(user)).map(({slug}) => slug)


        validate = user_permissions.some(item => permissons.includes(item));

        validate = user_permissions.indexOf('master') >= 0 ? user_permissions.indexOf('master') >= 0 : validate

      }
      return validate
    }

    async miscArray(array1, array2): Promise<any[]>{
      return Array.from(new Set([...array1, ...array2]));
    }

    async convertProxyArrayToJson(proxy: any[]){
      return proxy.map(p => {
        return p.toJSON()
      })
    }
}
export default AuthService
