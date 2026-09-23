const speechToTextService = require("../../services/transcription/SpeechToTextService").default
  || require("../../services/transcription/SpeechToTextService");

async function convertAudioToText(audioFilePath) {
  return speechToTextService.transcribeFile(audioFilePath);
}

module.exports = convertAudioToText;
