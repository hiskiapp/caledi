import { Caledi } from '../../Helpers/Caledi'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { Image } from 'canvas'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class MainController {
  public async index({ view }: HttpContextContract) {
    return view.render('index')
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        image: schema.string({}, [rules.required()]),
      }),
    })

    try {
      const caledi = new Caledi('20')
      const imageBuffer = Buffer.from(payload.image, 'base64')
      const image = new Image()
      image.src = imageBuffer
      const prediction = await caledi.predict(image)

      const logData = {
        result: prediction.result.name,
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        timestamp: new Date().toISOString(),
      }

      console.table(logData)

      return prediction
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }
}
