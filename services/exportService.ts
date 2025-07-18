// services/exportService.ts
import saveAs from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    PageBreak,
    AlignmentType,
    IParagraphOptions
} from 'docx';
import type { Novel, MarketingContent } from '../types.ts';

// A simple function to convert basic HTML to docx paragraphs.
// This is a simplification and doesn't handle all HTML tags or nested styles.
const createParagraphsFromHtml = (html: string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    if (!html) return paragraphs;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');

    const processNode = (node: Node): TextRun[] => {
        const runs: TextRun[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun(node.textContent || ''));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const style: { bold?: boolean; italics?: boolean; underline?: {} } = {};
            if (el.nodeName === 'B' || el.nodeName === 'STRONG') style.bold = true;
            if (el.nodeName === 'I' || el.nodeName === 'EM') style.italics = true;
            if (el.nodeName === 'U') style.underline = {};
            
            el.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    runs.push(new TextRun({ text: child.textContent || '', ...style }));
                }
                // Note: This simple version doesn't handle deeply nested styles well.
                // For <b><i>text</i></b>, it would process <i> as a text node.
                // A full recursive solution is complex; this covers most basic cases.
                else {
                     runs.push(new TextRun({ text: child.textContent || '', ...style }));
                }
            });
        }
        return runs;
    };
    
    // Split content by paragraphs and then process runs
    Array.from(tempDiv.children).forEach(p_node => {
        if (p_node.nodeName === 'P' || p_node.nodeName === 'BLOCKQUOTE' || p_node.nodeName === 'DIV') {
            const runs: TextRun[] = [];
            p_node.childNodes.forEach(child => {
                runs.push(...processNode(child));
            });
            
             const paragraphOptions: IParagraphOptions = {
                children: runs,
                ...(p_node.nodeName === 'BLOCKQUOTE' ? { style: 'IntenseQuote' } : {})
            };
            paragraphs.push(new Paragraph(paragraphOptions));
        }
    });

    if (paragraphs.length === 0 && tempDiv.textContent) {
        paragraphs.push(new Paragraph({ text: tempDiv.textContent }));
    }

    return paragraphs;
};

export const exportNovelToDocx = async (novel: Novel) => {
    const sections = novel.chapters.flatMap(chapter => [
        new Paragraph({
            text: chapter.title,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
        }),
        ...createParagraphsFromHtml(chapter.content),
    ]);
    
    const doc = new Document({
        creator: novel.publicationData.authorName || 'WriteWeave',
        title: novel.title,
        styles: {
            paragraphStyles: [{
                id: 'IntenseQuote',
                name: 'Intense Quote',
                basedOn: 'Normal',
                next: 'Normal',
                run: { italics: true, color: "555555" },
                paragraph: { indent: { left: 720 } },
            }],
        },
        sections: [{
            children: [
                new Paragraph({ text: novel.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `par ${novel.publicationData.authorName || ''}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new PageBreak()] }),
                ...(novel.publicationData.acknowledgements ? [
                    new Paragraph({ text: novel.publicationData.acknowledgements, alignment: AlignmentType.CENTER, style: 'IntenseQuote' }),
                    new Paragraph({ children: [new PageBreak()] }),
                ] : []),
                 ...(novel.publicationData.hasAdultContent ? [
                    new Paragraph({ text: novel.publicationData.adultContentDisclaimer || '', alignment: AlignmentType.LEFT }),
                    new Paragraph({ children: [new PageBreak()] }),
                ] : []),
                 ...(novel.publicationData.legalNotice ? [
                    ...novel.publicationData.legalNotice.split('\n').map(line => new Paragraph({ text: line, style: 'Normal' })),
                     new Paragraph({ children: [new PageBreak()] }),
                ] : []),
                ...sections
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${novel.title.replace(/\s/g, '_')}.docx`);
};

export const exportMarketingToPdf = async (novelTitle: string, content: MarketingContent) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.text(`Dossier Marketing: ${novelTitle}`, 14, y);
    y += 15;
    
    const addSection = (title: string, text: string) => {
        if (!text || !text.trim()) return;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text(title, 14, y);
        y += 8;
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 5) + 8;
    };

    const addTableSection = (title: string, head: any, body: any) => {
        if (!body || body.length === 0) return;
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text(title, 14, y);
        y += 8;
        (doc as any).autoTable({ startY: y, head, body });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    addSection("Pitch", content.elevator_pitch);
    addSection("Résumé de 4ème de couverture", content.back_cover_summary);
    addSection("Communiqué de Presse", content.press_release);
    addSection("Biographie Auteur", content.author_bio_template);
    
    if (content.keywords && content.keywords.length > 0) {
        addSection("Mots-clés", content.keywords.join(', '));
    }
    
    if (content.target_audience && content.target_audience.length > 0) {
        addTableSection("Public Cible", [['Persona', 'Description']], content.target_audience.map(p => [p.persona, p.description]));
    }
    if (content.social_media_posts && content.social_media_posts.length > 0) {
        addTableSection("Posts Réseaux Sociaux", [['Plateforme', 'Contenu']], content.social_media_posts.map(p => [p.platform, p.content]));
    }
    if (content.alternative_titles && content.alternative_titles.length > 0) {
        addTableSection("Titres Alternatifs", [['Titre', 'Justification']], content.alternative_titles.map(t => [t.title, t.justification]));
    }
    if (content.seo_keywords && content.seo_keywords.length > 0) {
       addTableSection("Mots-clés SEO", [['Mot-clé', 'Pertinence', 'Volume']], content.seo_keywords.map(k => [k.keyword, `${k.relevance}/10`, k.search_volume]));
    }
    
    doc.save(`${novelTitle.replace(/\s/g, '_')}_marketing.pdf`);
};