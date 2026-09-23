import axios from "axios";
import * as cheerio from "cheerio";
import { assertSafePublicUrl } from "../../utils/security/safeUrl";
import { AppError } from "../../lib/errors/AppError";

const FETCH_TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

const USER_AGENT =
  "Mozilla/5.0 (compatible; SumItUp/1.0; +https://github.com/m-a-y-a-n-k/SumItUp)";

export class UrlContentService {
  async extractMainText(rawUrl: string): Promise<string> {
    const safeUrl = await assertSafePublicUrl(rawUrl);

    const response = await axios.get(safeUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, noscript").remove();

    let textContent = "";
    $("p").each((_i, el) => {
      textContent += `${$(el).text()} `;
    });

    if (textContent.trim().length < 50) {
      textContent = $("body").text().replace(/\s+/g, " ").trim();
    }

    if (textContent.length < 100) {
      throw new AppError(
        "The webpage provided has insufficient text content to summarize.",
        400
      );
    }

    return textContent;
  }
}

const urlContentService = new UrlContentService();

export default urlContentService;
