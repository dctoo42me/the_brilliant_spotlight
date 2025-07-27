import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Load from root directory (not from /public)
    const filePath = path.join(process.cwd(), 'businesses.json');
    const data = await fs.readFile(filePath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to read data');
  }
}
