exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { texts, to } = JSON.parse(event.body);

    if (!texts || !texts.length || !to || to === 'uk') {
      return { statusCode: 200, body: JSON.stringify({ translations: texts || [] }) };
    }

    const { translate } = await import('@vitalets/google-translate-api');

    // Batch: join with separator, translate, split
    const separator = '\n---\n';
    const batch = texts.join(separator);
    const result = await translate(batch, { to });
    const translations = result.text.split(separator).map((t: string) => t.trim());

    return {
      statusCode: 200,
      body: JSON.stringify({ translations }),
    };
  } catch (error) {
    return { statusCode: 200, body: JSON.stringify({ translations: [] }) };
  }
};
