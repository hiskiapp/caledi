import * as tf from '@tensorflow/tfjs-node'
import { Image, createCanvas, Canvas } from 'canvas'

export class Caledi {
  private model: Promise<tf.LayersModel>
  private labels: string[] = [
    'brown leaf spot',
    'brown_streak_disease',
    'green_might_damage',
    'healthy',
    'mosaic_disease',
    'read_mite_damage',
  ]

  constructor(type: '20' | '30') {
    this.model = this.loadModel(type)
  }

  private async loadModel(type: '20' | '30'): Promise<tf.LayersModel> {
    if (type === '20') {
      return tf.loadLayersModel('file://./resources/models/20/model.json')
    } else {
      return tf.loadLayersModel('file://./resources/models/30/model.json')
    }
  }

  private processImage(img: Image): tf.Tensor3D {
    const canvas: Canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, img.width, img.height)
    let input: tf.Tensor3D = tf.browser.fromPixels(canvas)
    const resized: tf.Tensor3D = tf.image.resizeBilinear(input, [300, 300])
    const reshaped: tf.Tensor4D = resized.reshape([1, 300, 300, 3])

    return reshaped.div(255.0)
  }

  public async predict(
    img: Image
  ): Promise<{ prediction: object; result: { name: string; value: number } }> {
    const model: tf.LayersModel = await this.model
    const input: tf.Tensor3D = this.processImage(img)
    const predict: tf.Tensor = model.predict(input) as tf.Tensor
    const predictArray: Float32Array = (await predict.data()) as Float32Array

    let prediction = {}
    let result = { name: '', value: 0 }

    for (let i = 0; i < predictArray.length; i++) {
      prediction[this.labels[i]] = predictArray[i]

      if (predictArray[i] > result.value) {
        result = {
          name: this.labels[i],
          value: predictArray[i],
        }
      }
    }

    if (result.value < 0.5) {
      result = { name: 'unknown', value: 0 }
    }

    return { prediction, result }
  }
}
