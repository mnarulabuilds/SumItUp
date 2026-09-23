const fs = require("fs");
const tf = require("@tensorflow/tfjs");
const mobilenet = require("@tensorflow-models/mobilenet");
const jpeg = require("jpeg-js");

// Polyfill fetch for node environment (required by tfjs models)
global.fetch = require("node-fetch");
if (!global.fetch) {
  // If node-fetch is not installed, we might have issues loading the model.
  // Try to fallback or ensure it's there. 
  // Usually standard node v18+ has fetch. If not, use 'axios' or similar if needed, 
  // but mobilenet expects global.fetch.
}

async function convertImageToText(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      return "Error: Image file not found.";
    }

    // 1. Load the model
    // Note: Loading model every time is slow. In prod, cache this.
    const model = await mobilenet.load();

    // 2. Read and Decode Image
    const imageBuffer = fs.readFileSync(imagePath);
    // Support JPG/PNG - jpeg-js only supports JPG. 
    // For PNG we'd need pngjs. Assuming JPG for now from UploadScreen logic.
    const rawImageData = jpeg.decode(imageBuffer, { useTArray: true });

    // 3. Convert to Tensor
    const numChannels = 3;
    const numPixels = rawImageData.width * rawImageData.height;
    const values = new Int32Array(numPixels * numChannels);

    for (let i = 0; i < numPixels; i++) {
      for (let c = 0; c < numChannels; c++) {
        values[i * numChannels + c] = rawImageData.data[i * 4 + c];
      }
    }

    const imageTensor = tf.tensor3d(values, [rawImageData.height, rawImageData.width, numChannels]);

    // 4. Classify
    const predictions = await model.classify(imageTensor);

    // Cleanup tensor
    imageTensor.dispose();

    if (!predictions || predictions.length === 0) {
      return "AI Analysis: No specific objects detected.";
    }

    // 5. Format Summary with Context
    const topPred = predictions[0];
    const confidence = topPred.probability;
    const secondaryPreds = predictions.slice(1, 3);

    // Simple scene inference based on keywords
    const keywords = topPred.className.toLowerCase();
    let sceneContext = "General Object";
    if (/(dog|cat|bird|animal|fish|horse|sheep)/.test(keywords)) sceneContext = "Nature / Wildlife";
    else if (/(car|truck|bike|bus|vehicle|plane|boat)/.test(keywords)) sceneContext = "Transportation";
    else if (/(monitor|screen|keyboard|mouse|laptop|phone|computer)/.test(keywords)) sceneContext = "Technology / Office";
    else if (/(mug|cup|plate|fork|bowl|knife|spoon|bottle)/.test(keywords)) sceneContext = "Dining / Kitchen";
    else if (/(room|wall|floor|carpet|ceiling|furniture|chair|sofa|table)/.test(keywords)) sceneContext = "Indoor Setting";
    else if (/(tree|flower|plant|grass|sky|mountain|beach)/.test(keywords)) sceneContext = "Outdoor Landscape";
    else if (/(shirt|dress|pants|shoe|hat|coat)/.test(keywords)) sceneContext = "Fashion / Apparel";

    let summary = "";

    if (confidence > 0.6) {
      summary = `The image clearly depicts a **${topPred.className}**. `;
    } else if (confidence > 0.3) {
      summary = `The image likely shows a **${topPred.className}**, possibly in a ${sceneContext.toLowerCase()} setting. `;
    } else {
      summary = `The image is somewhat unclear, but it appears to resemble a **${topPred.className}**. `;
    }

    if (secondaryPreds.length > 0) {
      const others = secondaryPreds.map(p => p.className).join(" or ");
      summary += `Other potential elements observed include: ${others}.`;
    }

    summary += `\n\n**Contextual Summary**: This visual content identifies as *${sceneContext}*. It was analyzed with local high-performance classification models.`;

    return summary;

  } catch (error) {
    console.error("ML processing error:", error);
    // Fallback if ML fails (e.g. non-jpg image, memory limit)
    return `[System] Image processed. 
    (Machine Learning classification failed: ${error.message}.Please ensure you uploaded a valid JPEG image).`;
  }
}

module.exports = convertImageToText;
