import Env from '@ioc:Adonis/Core/Env'
/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Bull from '@ioc:Rocketseat/Bull'

const PORT = 9997
const isDevelopment = Env.get('NODE_ENV') === 'development'

Bull.process()

if (isDevelopment) {
  Bull.ui(PORT)
}
