import AdonisServer from '@ioc:Adonis/Core/Server'
import { WebSocketServer } from 'ws'

class Ws {
   public wss: WebSocketServer
   private booted = false

   public boot() {
      /**
       * Ignore multiple calls to the boot method
       */
      if (this.booted) {
         return
      }
      this.booted = true
      this.wss = new WebSocketServer({ server: AdonisServer.instance! })
      //console.log("WebSocket Server Started.");

   }
}

export default new Ws()
