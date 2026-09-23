import { generateImageSummary } from "./generateImageSummary";
import { generateAudioSummary } from "./generateAudioSummary";
import { generateVideoSummary } from "./generateVideoSummary";
import { generateGifSummary } from "./generateGifSummary";
import { generateUrlSummary } from "./generateUrlSummary";
import { generateBookSummary } from "./generateBookSummary";
import { generatePDFSummary } from "./generatePDFSummary";
import { generateMeetingSummary } from "./generateMeetingSummary";

const summaryController = {
  generateAudioSummary,
  generateImageSummary,
  generateVideoSummary,
  generateGifSummary,
  generateUrlSummary,
  generateBookSummary,
  generatePDFSummary,
  generateMeetingSummary,
}

export default summaryController;
