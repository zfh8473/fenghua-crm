/**
 * Chart Export Utilities
 * 
 * Utilities for exporting charts to images
 * All custom code is proprietary and not open source.
 */

import html2canvas from 'html2canvas';

/**
 * Export chart element to image
 * @param elementId ID of the chart container element
 * @param format Image format ('png' | 'jpeg')
 * @param fileName Optional file name
 * @returns Promise that resolves when download starts
 */
export async function exportChartToImage(
  elementId: string,
  format: 'png' | 'jpeg' = 'png',
  fileName?: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`找不到图表元素: ${elementId}`);
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: false,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('无法生成图片'));
          }
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        0.95, // Quality for JPEG
      );
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `chart_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('图表导出失败:', error);
    throw new Error('图表导出失败，请稍后重试');
  }
}

/**
 * Export multiple chart elements to a single image
 * @param elementIds Array of chart container element IDs
 * @param format Image format ('png' | 'jpeg')
 * @param fileName Optional file name
 * @returns Promise that resolves when download starts
 */
export async function exportMultipleChartsToImage(
  elementIds: string[],
  format: 'png' | 'jpeg' = 'png',
  fileName?: string,
): Promise<void> {
  if (elementIds.length === 0) {
    throw new Error('至少需要选择一个图表');
  }

  try {
    const canvases = await Promise.all(
      elementIds.map(async (id) => {
        const element = document.getElementById(id);
        if (!element) {
          throw new Error(`找不到图表元素: ${id}`);
        }
        return await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
        });
      }),
    );

    // Create a combined canvas
    const maxWidth = Math.max(...canvases.map((c) => c.width));
    const totalHeight = canvases.reduce((sum, c) => sum + c.height + 20, 0); // 20px spacing
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;

    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maxWidth, totalHeight);

    // Draw each canvas
    let y = 0;
    canvases.forEach((canvas) => {
      ctx.drawImage(canvas, (maxWidth - canvas.width) / 2, y); // Center each chart
      y += canvas.height + 20; // Add spacing
    });

    // Convert to blob and download
    const blob = await new Promise<Blob>((resolve, reject) => {
      combinedCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('无法生成图片'));
          }
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        0.95,
      );
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `charts_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('多图表导出失败:', error);
    throw new Error('图表导出失败，请稍后重试');
  }
}

