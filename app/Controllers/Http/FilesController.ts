export default class FilesController {


  // /**
  //  * Upload único de arquivo
  //  */
  // public async singleUpload({ request, response }: HttpContextContract) {
  //   const file = request.file('file', {
  //     size: '5mb', // Limite de tamanho para o arquivo
  //     extnames: ['jpg', 'jpeg', 'webp', 'png', 'pdf'], // Tipos permitidos
  //   });

  //   if (!file) {
  //     return response.badRequest({ message: 'Nenhum arquivo enviado' });
  //   }

  //   if (file.hasErrors) {
  //     return response.badRequest({ message: 'Erro no arquivo enviado', errors: file.errors });
  //   }

  //   const isImage = ['image'].includes(file.type || '');

  //   if (isImage) {
  //     const outputDir = Application.publicPath('uploads');
  //     const uniqueName = `${Date.now()}-${file.clientName}`;
  //     const outputPath = path.join(outputDir, uniqueName);

  //     try {
  //       const compressedBuffer = await sharp(file.tmpPath)
  //         .jpeg({ quality: 80 })
  //         .resize({ width: 1000 }) // Ajusta a largura máxima
  //         .toBuffer();

  //       if (compressedBuffer.length > 100 * 1024) {
  //         const finalBuffer = await sharp(compressedBuffer)
  //           .jpeg({ quality: 50 }) // Reduz mais a qualidade
  //           .toBuffer();

  //         fs.writeFileSync(outputPath, finalBuffer);
  //       } else {
  //         fs.writeFileSync(outputPath, compressedBuffer);
  //       }

  //       return response.ok({
  //         message: 'Imagem salva com sucesso',
  //         filePath: `${Env.get('SERVER_URL')}/uploads/${uniqueName}`,
  //       });
  //     } catch (error) {
  //       console.error('Erro ao processar a imagem:', error);
  //       return response.internalServerError({ message: 'Erro ao processar a imagem' });
  //     }
  //   }

  //   // Caso não seja uma imagem, mova normalmente
  //   await file.move(Application.publicPath('uploads'));

  //   return response.ok({
  //     message: 'Arquivo salvo',
  //     filePath: `${Env.get('SERVER_URL')}/uploads/${file.fileName}`,
  //   });
  // }

  // /**
  //  * Upload de múltiplos arquivos
  //  */
  // public async multipleUpload({ request, response }: HttpContextContract) {
  //   const files = request.files('files', {
  //     size: '5mb', // Limite de tamanho para cada arquivo
  //     extnames: ['jpg', 'png', 'pdf'], // Tipos permitidos
  //   })

  //   let uploadedFiles: string[] = []

  //   for (let file of files) {
  //     if (file.hasErrors) {
  //       return response.badRequest(file.errors)
  //     }

  //     // Move cada arquivo para a pasta 'uploads'
  //     await file.move(Application.publicPath('uploads'))
  //     uploadedFiles.push(`/uploads/${file.fileName}`)
  //   }

  //   return response.ok({ uploadedFiles })
  // }
}
