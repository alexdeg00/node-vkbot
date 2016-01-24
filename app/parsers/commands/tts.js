'use strict';

const fs = require('fs');
const ffprobe = require('../../modules/node-ffprobe');
const joinMp3 = require('../../modules/tts-join-mp3');
const prequest = require('request-promise');
const pathConfig = require('../../config/commands/config').path;

/**
 * Озвучивание текста и заливка аудиозаписи во ВКонтакте
 */
module.exports = (arg, callback) => {
  let argText = arg.fullText();
  let VK = arg.wholeObj()._vkapi;

  if (argText === null) 
    return callback(null);

  // Убираем озвучку перевода на новую строку
  argText = argText.replace(/<br>/g, ',');

  let reqUrl = 'https://tts.voicetech.yandex.net/tts?text='+ encodeURIComponent(argText) +'&lang=ru_RU&format=mp3&quality=hi&platform=web&application=translate';
  let fileName = pathConfig['tts'] + 'tts_' + Date.now() + '.mp3';

  function saveAudio (newTtsFileName) {
    let uploadFile = newTtsFileName || fileName;

    return VK.upload('audio', fs.createReadStream(uploadFile))
      .then(res => {
        try {
          fs.unlinkSync(fileName);

          if (newTtsFileName) 
            fs.unlinkSync(newTtsFileName);
        } catch (e) {}

        return callback({
          attachments: 'audio' + res.owner_id + '_' + res.id
        });
      });
  }

  return prequest(reqUrl).pipe(fs.createWriteStream(fileName)).on('close', () => {
    ffprobe(fileName, (err, data) => {
      if (data.duration < 5) 
        joinMp3(fileName, newFileName => saveAudio(newFileName));
      else
        saveAudio();
    });
  });
}