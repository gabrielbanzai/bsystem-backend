import fsp from 'fs/promises'

class FIleService {
  async readFileToJson(url){
    let data = await fsp.readFile(url)
    return  JSON.parse(data.toString())
  }

  async readFileToString(url){
    let data = await fsp.readFile(url)
    return  data.toString()
  }
}
export default FIleService
