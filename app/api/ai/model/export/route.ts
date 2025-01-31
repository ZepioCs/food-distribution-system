import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const modelPath = path.join(process.cwd(), 'ai', 'model.json');
    const modelInfoPath = path.join(process.cwd(), 'ai', 'model-info.json');

    if (!fs.existsSync(modelPath)) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    const modelInfo = JSON.parse(fs.readFileSync(modelInfoPath, 'utf8'));

    const exportData = {
      model,
      info: modelInfo,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=model-export.json'
      }
    });
  } catch (error) {
    console.error('Error exporting model:', error);
    return NextResponse.json({ error: 'Failed to export model' }, { status: 500 });
  }
} 