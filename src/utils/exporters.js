import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function exportPdf(pngDataUrl, logicalSize) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2 - 20;
  const ratio = Math.min(maxW / logicalSize.w, maxH / logicalSize.h);
  const w = logicalSize.w * ratio;
  const h = logicalSize.h * ratio;
  const x = (pageW - w) / 2;
  const y = margin;

  pdf.addImage(pngDataUrl, 'PNG', x, y, w, h);
  pdf.setFontSize(9);
  pdf.setTextColor(130);
  pdf.text('© 2026 — developed and designed by Aditya', pageW / 2, pageH - 14, { align: 'center' });
  pdf.save('inkwell-notes.pdf');
}

export function exportTxt(textNotes) {
  const body = textNotes.length
    ? textNotes.join('\n\n')
    : 'This page is a freehand drawing / handwritten note. Download it as PDF or DOCX to see the visual content.';
  const content = body + '\n\n----------------------------------------\n© 2026 — developed and designed by Aditya';
  downloadBlob(new Blob([content], { type: 'text/plain' }), 'inkwell-notes.txt');
}

function escapeXML(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function dataURLToBytes(dataURL) {
  const base64 = dataURL.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function exportDocx(pngDataUrl, textNotes, logicalSize) {
  const zip = new JSZip();
  const pngBytes = dataURLToBytes(pngDataUrl);

  const EMU_PER_PX = 9525;
  let widthEMU = logicalSize.w * EMU_PER_PX;
  let heightEMU = logicalSize.h * EMU_PER_PX;
  const maxWidthEMU = 5486400; // 6 inches
  if (widthEMU > maxWidthEMU) {
    const s = maxWidthEMU / widthEMU;
    widthEMU = maxWidthEMU;
    heightEMU = Math.round(heightEMU * s);
  }

  const noteParagraphs = textNotes.length
    ? textNotes.map((t) => {
        const lines = escapeXML(t)
          .split('\n')
          .map((l) => `<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${l}</w:t></w:r><w:br/>`)
          .join('');
        return `<w:p>${lines}</w:p>`;
      }).join('')
    : `<w:p><w:r><w:t>This page is a freehand drawing / handwritten note — see the embedded image below.</w:t></w:r></w:p>`;

  const documentXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="40"/></w:rPr><w:t>Inkwell — My Notes</w:t></w:r></w:p>
<w:p/>
${noteParagraphs}
<w:p/>
<w:p><w:r><w:drawing>
<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<wp:extent cx="${widthEMU}" cy="${heightEMU}"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:docPr id="1" name="Notes"/>
<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:nvPicPr><pic:cNvPr id="0" name="notes.png"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEMU}" cy="${heightEMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
</pic:pic>
</a:graphicData>
</a:graphic>
</wp:inline>
</w:drawing></w:r></w:p>
<w:p/>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="808080"/></w:rPr><w:t>© 2026 — developed and designed by Aditya</w:t></w:r></w:p>
</w:body>
</w:document>`;

  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`;

  zip.file('[Content_Types].xml', contentTypesXML);
  zip.folder('_rels').file('.rels', relsXML);
  const wordFolder = zip.folder('word');
  wordFolder.folder('_rels').file('document.xml.rels', docRelsXML);
  wordFolder.file('document.xml', documentXML);
  wordFolder.folder('media').file('image1.png', pngBytes);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  downloadBlob(blob, 'inkwell-notes.docx');
}
