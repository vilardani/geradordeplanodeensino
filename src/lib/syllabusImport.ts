// pdfjs-dist e mammoth são carregados sob demanda (import dinâmico) para não
// inflar o bundle inicial de quem nunca usa a importação de documentos.
let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;
function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = Promise.all([
      import('pdfjs-dist'),
      // @ts-ignore - Vite resolves this to a worker asset URL at build time
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerUrlModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = (workerUrlModule as any).default;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

export const COURSES_LIST = [
  "Administração",
  "Administração Pública",
  "Agronegócio",
  "Agronomia",
  "Análise e Desenvolvimento de Sistemas",
  "Arquitetura e Urbanismo",
  "Banco de Dados",
  "Biomedicina",
  "Ciência da Computação",
  "Ciência de Dados",
  "Ciência Política",
  "Ciências Contábeis",
  "Ciências Econômicas",
  "Comércio Exterior",
  "Comunicação Institucional",
  "Comunicação Social - Publicidade e Propaganda",
  "Desenvolvimento Full Stack",
  "Design de Animação",
  "Direito",
  "Educação Física - Bacharelado",
  "Enfermagem",
  "Engenharia Civil",
  "Engenharia de Computação",
  "Engenharia de Produção",
  "Engenharia Elétrica",
  "Engenharia Mecatrônica",
  "Estética e Cosmética",
  "Farmácia",
  "Fisioterapia",
  "Fonoaudiologia",
  "Gestão Ambiental",
  "Gestão Comercial",
  "Gestão da Tecnologia da Informação",
  "Gestão de Cooperativas",
  "Gestão de Negócios",
  "Gestão de Negócios Imobiliários",
  "Gestão de Recursos Humanos",
  "Gestão de Serviços Judiciais e Notariais",
  "Gestão de Turismo",
  "Gestão Financeira",
  "Gestão Portuária",
  "Gestão Pública",
  "Hotelaria",
  "Inteligência Artificial",
  "Jogos Digitais",
  "Logística",
  "Marketing",
  "Medicina",
  "Medicina Veterinária",
  "Nutrição",
  "Odontologia",
  "Pedagogia",
  "Processos Gerenciais",
  "Produção Cultural",
  "Psicologia",
  "Química",
  "Redes de Computadores",
  "Relações Internacionais",
  "Relações Públicas",
  "Saúde Digital e Ciências de Dados",
  "Secretariado",
  "Segurança Cibernética",
  "Segurança da Informação",
  "Serviço Social",
  "Serviços Penais",
  "Sistemas de Computação",
  "Sistemas de Informação",
  "Sistemas para Internet",
  "Superior de Tecnologia em Radiologia",
  "Tecnologia em Análise e Desenvolvimento de Sistemas",
  "Tecnologia em Estética e Cosmética",
  "Teologia",
  "Terapia Ocupacional"
];

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[✓✔•·▪➢∙]|-{1,2}|\*|\[\d+\]|\(\d+\)|\d+[.)])\s*/, '').trim();
}

// --- Text extraction -------------------------------------------------

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const outputLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as any[];

    const rowMap: { y: number; parts: { x: number; str: string }[] }[] = [];
    for (const item of items) {
      const str: string = item.str;
      if (!str || !str.trim()) continue;
      const y = item.transform[5];
      let row = rowMap.find(r => Math.abs(r.y - y) < 3);
      if (!row) {
        row = { y, parts: [] };
        rowMap.push(row);
      }
      row.parts.push({ x: item.transform[4], str });
    }

    const rows = rowMap
      .map(r => ({
        y: r.y,
        text: r.parts.sort((a, b) => a.x - b.x).map(p => p.str).join(' ').replace(/\s+/g, ' ').trim()
      }))
      .filter(r => r.text)
      .sort((a, b) => b.y - a.y);

    const gaps = rows.slice(1).map((r, i) => rows[i].y - r.y).filter(g => g > 0);
    const typicalGap = gaps.length ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 14;

    rows.forEach((row, i) => {
      if (i > 0) {
        const gap = rows[i - 1].y - row.y;
        if (gap > typicalGap * 1.6) outputLines.push('');
      }
      outputLines.push(row.text);
    });
    outputLines.push('', '');
  }

  return outputLines.join('\n');
}

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractTextFromPdf(file);
  if (name.endsWith('.docx')) return extractTextFromDocx(file);
  throw new Error('Formato não suportado. Envie um arquivo .pdf ou .docx.');
}

// --- Structured parsing ------------------------------------------------

const FIELD_DEFS: { key: string; re: RegExp }[] = [
  { key: 'subject', re: /Disciplina\s*:/i },
  { key: 'professor', re: /Docente(?:\s+Respons[aá]vel)?\s*:/i },
  { key: 'course', re: /Curso\s*:/i },
  { key: 'period', re: /Per[ií]odo\s*:/i },
  { key: 'semester', re: /Semestre\s*:/i },
  { key: 'matrixYear', re: /Matriz\s+Curricular\s*:/i },
  { key: 'workloadTotal', re: /Carga\s+Hor[aá]ria\s+Total(?:\s+da\s+Disciplina)?\s*:/i },
  { key: 'workloadTheoretical', re: /C\.?\s?H\.?\s*Te[oó]rica\s*:/i },
  { key: 'workloadPractical', re: /C\.?\s?H\.?\s*Pr[aá]tica\s*:/i },
  { key: 'workloadOnlineAsync', re: /C\.?\s?H\.?\s*On\s*[- ]?[Ll]ine\s*Ass[ií]ncrona\s*:/i },
  { key: 'workloadOnlineSync', re: /C\.?\s?H\.?\s*On\s*[- ]?[Ll]ine\s*S[ií]ncrona\s*:/i },
  { key: 'workloadCombinedOnline', re: /\bEaD\s*:/i },
  { key: 'workloadInternship', re: /Est[áa]gio\s*:/i },
  { key: 'workloadExtension', re: /Extens[ãa]o\s*:/i },
  { key: 'workloadExtensionShort', re: /\bExt\.?\s*:/i },
];

const STOP_LOOKAHEAD = FIELD_DEFS.map(f => f.re.source).concat(['\\n\\s*\\n', 'EMENTA']).join('|');

function findField(headerText: string, re: RegExp): string | null {
  const pattern = new RegExp(`${re.source}\\s*([\\s\\S]*?)(?=${STOP_LOOKAHEAD}|$)`, 'i');
  const m = headerText.match(pattern);
  if (!m) return null;
  const value = m[1].replace(/\s+/g, ' ').trim();
  return value || null;
}

function toInt(value: string | null): number | null {
  if (value === null) return null;
  const m = value.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

// Marcadores de lista sem números soltos — usado ao separar bibliografia, onde números
// de edição em citações ABNT ("13. ed. Rio de Janeiro...") no início de uma linha
// quebrada seriam confundidos com marcadores de lista numerada.
const BULLET_START_NO_NUMBERS = /^(?:[✓✔•·▪➢∙]|-{1,2}|\*|\[\d+\]|\(\d+\))\s+/;
// Mesmo conjunto, incluindo "1.", "2." — usado para competências/objetivos/temas, onde a
// própria disciplina não tem números de edição para colidir (a versão gerada por este app
// exibe essas listas com numeração automática, que a extração de texto capta como texto).
const BULLET_START_WITH_NUMBERS = /^(?:[✓✔•·▪➢∙]|-{1,2}|\*|\[\d+\]|\(\d+\)|\d+[.)])\s+/;
// Frase comum (competências, objetivos): termina em pontuação final.
const SENTENCE_TERMINAL = /[.!?:]["')\]]?$/;
// Referência ABNT (bibliografia): a forma mais confiável de identificar o fim de
// uma citação é o ano de publicação no final, já que o texto tem vários pontos
// internos (abreviações de edição, cidade, etc.) que quebram a heurística de frase.
const CITATION_TERMINAL = /\d{4}\.?["')\]]?$/;

// Reconstrói "parágrafos" a partir de linhas soltas (comum em texto extraído de PDF,
// onde não há uma marca confiável de fim de parágrafo). Prioriza marcadores de lista
// (✓, •, -, etc.) quando presentes; caso contrário, agrupa linhas até encontrar uma
// que termine com o padrão de "fim de item" informado.
function splitIntoBlocks(text: string, terminal: RegExp = SENTENCE_TERMINAL, allowNumericBullets = true): string[] {
  const bulletStart = allowNumericBullets ? BULLET_START_WITH_NUMBERS : BULLET_START_NO_NUMBERS;
  const rawLines = text.split('\n').map(l => l.trim());
  const hasBullets = rawLines.some(l => bulletStart.test(l));

  const blocks: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) {
      blocks.push(current.join(' '));
      current = [];
    }
  };

  for (const line of rawLines) {
    if (!line) {
      if (!hasBullets) flush();
      continue;
    }
    if (hasBullets) {
      if (bulletStart.test(line)) flush();
      current.push(line);
    } else {
      current.push(line);
      if (terminal.test(line)) flush();
    }
  }
  flush();

  return blocks
    .map(b => b.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map(stripBullet)
    .filter(Boolean);
}

const SECTION_DEFS: { key: string; re: RegExp }[] = [
  { key: 'ementa', re: /^[ \t]*(?:\d+\.\s*)?EMENTA(?:\s+DA\s+DISCIPLINA)?[ \t]*$/im },
  { key: 'competencias', re: /^[ \t]*(?:\d+\.\s*)?COMPET[ÊE]NCIAS[^\n]*$/im },
  { key: 'objetivos', re: /^[ \t]*(?:\d+\.\s*)?OBJETIVOS(?:\s+DA\s+DISCIPLINA)?[ \t]*$/im },
  { key: 'metodologia', re: /^[ \t]*(?:\d+\.\s*)?(?:METODOLOGIA(?:\s+DE\s+ENSINO)?(?:\s+E\s+ESTRUTURA(?:\s+DA\s+DISCIPLINA)?)?|PROCEDIMENTOS\s+METODOL[ÓO]GICOS[^\n]*)[ \t]*$/im },
  { key: 'conteudo', re: /^[ \t]*(?:\d+\.\s*)?CONTE[ÚU]DO\s+PROGRAM[ÁA]TICO[^\n]*$/im },
  { key: 'avaliacao', re: /^[ \t]*(?:\d+\.\s*)?(?:SISTEMA|CRIT[ÉE]RIOS)\s+DE\s+AVALIA[ÇC][ÃA]O[^\n]*$/im },
  { key: 'referencias', re: /^[ \t]*(?:\d+\.\s*)?REFER[ÊE]NCIAS\s+BIBLIOGR[ÁA]FICAS[^\n]*$/im },
];

const BIB_SUBSECTION_DEFS: { key: string; re: RegExp }[] = [
  { key: 'basica', re: /^[ \t]*(?:8?\.?\d*\s*)?BIBLIOGRAFIA\s+B[ÁA]SICA[^\n]*$/im },
  { key: 'complementar', re: /^[ \t]*(?:8?\.?\d*\s*)?BIBLIOGRAFIA\s+COMPLEMENTAR[^\n]*$/im },
  { key: 'materiais', re: /^[ \t]*(?:8?\.?\d*\s*)?MATERIA(?:L|IS)\s+(?:DID[ÁA]TICOS?\s+)?COMPLEMENTAR(?:ES)?[^\n]*$/im },
];

function sliceBySections(text: string, defs: { key: string; re: RegExp }[]) {
  const found = defs
    .map(d => {
      const m = d.re.exec(text);
      return m ? { key: d.key, start: m.index, end: m.index + m[0].length } : null;
    })
    .filter((x): x is { key: string; start: number; end: number } => x !== null)
    .sort((a, b) => a.start - b.start);

  const sections: Record<string, string> = {};
  found.forEach((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].start : text.length;
    sections[f.key] = text.slice(f.end, end).trim();
  });
  return { sections, firstStart: found.length ? found[0].start : text.length };
}

function parseUnits(conteudoText: string) {
  const unitRe = /^[ \t]*UNIDADE\s*\d+[^\n]*$/gim;
  const matches: { start: number; end: number; header: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = unitRe.exec(conteudoText)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, header: m[0].trim() });
  }

  return matches.map((unit, i) => {
    const chunkEnd = i + 1 < matches.length ? matches[i + 1].start : conteudoText.length;
    const body = conteudoText.slice(unit.end, chunkEnd);

    let summary = '';
    let themesSource = body;
    const summaryMatch = body.match(/(?:Contexto\s+geral|Resumo(?:\s+da\s+unidade)?)\s*:?\s*([\s\S]*)$/i);
    if (summaryMatch) {
      summary = summaryMatch[1].replace(/\s+/g, ' ').trim();
      themesSource = body.slice(0, summaryMatch.index);
    }

    const themes = splitIntoBlocks(themesSource).map(title => ({ title, summary: '' }));
    return { unitName: unit.header.replace(/\s+/g, ' ').trim(), themes, summary };
  });
}

function matchCourse(raw: string | null): { value: string | null; warning: string | null } {
  if (!raw) return { value: null, warning: null };
  const normRaw = normalize(raw);
  const exact = COURSES_LIST.find(c => normalize(c) === normRaw);
  if (exact) return { value: exact, warning: null };
  const partial = COURSES_LIST.find(c => normRaw.includes(normalize(c)) || normalize(c).includes(normRaw));
  if (partial) return { value: partial, warning: null };
  return { value: null, warning: `Curso "${raw}" não reconhecido na lista — selecione manualmente.` };
}

export function parseSyllabusText(rawText: string): { data: Record<string, any>; warnings: string[] } {
  const warnings: string[] = [];
  const data: Record<string, any> = {};
  const workload: Record<string, number> = {};

  const { sections, firstStart } = sliceBySections(rawText, SECTION_DEFS);
  const headerText = rawText.slice(0, firstStart);

  // Identification fields
  const subject = findField(headerText, FIELD_DEFS.find(f => f.key === 'subject')!.re);
  if (subject) data.subject = subject;

  const professor = findField(headerText, FIELD_DEFS.find(f => f.key === 'professor')!.re);
  if (professor) data.professor = professor;

  const courseRaw = findField(headerText, FIELD_DEFS.find(f => f.key === 'course')!.re);
  const courseMatch = matchCourse(courseRaw);
  if (courseMatch.value) data.course = courseMatch.value;
  if (courseMatch.warning) warnings.push(courseMatch.warning);

  const period = findField(headerText, FIELD_DEFS.find(f => f.key === 'period')!.re);
  if (period) data.period = period;

  const semester = findField(headerText, FIELD_DEFS.find(f => f.key === 'semester')!.re);
  if (semester) data.semester = semester;

  const matrixYear = findField(headerText, FIELD_DEFS.find(f => f.key === 'matrixYear')!.re);
  if (matrixYear) data.matrixYear = matrixYear;

  const total = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadTotal')!.re));
  if (total !== null) workload.total = total;
  const theoretical = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadTheoretical')!.re));
  if (theoretical !== null) workload.theoretical = theoretical;
  const practical = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadPractical')!.re));
  if (practical !== null) workload.practical = practical;
  const internship = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadInternship')!.re));
  if (internship !== null) workload.internship = internship;
  const extension =
    toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadExtension')!.re)) ??
    toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadExtensionShort')!.re));
  if (extension !== null) workload.extension = extension;

  const async_ = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadOnlineAsync')!.re));
  const sync_ = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadOnlineSync')!.re));
  const combinedOnline = toInt(findField(headerText, FIELD_DEFS.find(f => f.key === 'workloadCombinedOnline')!.re));
  if (async_ !== null) workload.onlineAsync = async_;
  if (sync_ !== null) workload.onlineSync = sync_;
  if (async_ === null && sync_ === null && combinedOnline !== null) {
    workload.onlineAsync = combinedOnline;
    if (combinedOnline > 0) warnings.push('Carga horária "EaD" combinada foi atribuída à Online Assíncrona — separe manualmente se necessário.');
  }

  if (Object.keys(workload).length) data.workload = workload;

  // Free-text / long sections
  if (sections.ementa) data.syllabusText = sections.ementa.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (sections.metodologia) {
    data.methodologyCustom = sections.metodologia.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (sections.avaliacao) {
    const blocks = splitIntoBlocks(sections.avaliacao);
    data.evaluationCustom = blocks.length > 1 ? blocks.map(b => `• ${b}`).join('\n\n') : sections.avaliacao.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Lists
  if (sections.competencias) {
    const items = splitIntoBlocks(sections.competencias);
    if (items.length) data.competencies = items;
    else warnings.push('Não consegui separar as competências em itens — revise a seção manualmente.');
  }
  if (sections.objetivos) {
    const items = splitIntoBlocks(sections.objetivos);
    if (items.length) data.objectives = items;
    else warnings.push('Não consegui separar os objetivos em itens — revise a seção manualmente.');
  }

  // Program content
  if (sections.conteudo) {
    const units = parseUnits(sections.conteudo);
    if (units.length) data.programContent = units;
    else warnings.push('Não encontrei unidades ("UNIDADE 1", "UNIDADE 2"...) no conteúdo programático.');
  }

  // Bibliography
  if (sections.referencias) {
    const { sections: bibSections } = sliceBySections(sections.referencias, BIB_SUBSECTION_DEFS);

    if (bibSections.basica) {
      const entries = splitIntoBlocks(bibSections.basica, CITATION_TERMINAL, false);
      data.basicBibliography = entries.map(entry => {
        const urlMatch = entry.match(/https?:\/\/\S+/);
        const link = urlMatch ? urlMatch[0].replace(/[).,;]+$/, '') : '';
        const text = entry
          .replace(/Acesso\s+via\s+Minha\s+Biblioteca\s*:?/i, '')
          .replace(/Dispon[ií]vel\s+em\s*:?/i, '')
          .replace(urlMatch ? urlMatch[0] : '', '')
          .replace(/\s+/g, ' ')
          .trim();
        return { text, link };
      });
    }
    if (bibSections.complementar) {
      const entries = splitIntoBlocks(bibSections.complementar, CITATION_TERMINAL, false);
      if (entries.length) data.complementaryBibliography = entries;
    }
    if (bibSections.materiais) {
      const entries = splitIntoBlocks(bibSections.materiais, CITATION_TERMINAL, false);
      if (entries.length) data.materials = entries;
    }
    if (!bibSections.basica && !bibSections.complementar && !bibSections.materiais) {
      warnings.push('Não encontrei as subseções de Bibliografia Básica/Complementar/Materiais — revise manualmente.');
    }
  }

  if (!subject) warnings.push('Não localizei o nome da disciplina — preencha manualmente.');
  if (!professor) warnings.push('Não localizei o nome do(a) docente — preencha manualmente.');
  if (!courseRaw) warnings.push('Não localizei o curso — selecione manualmente.');
  if (!sections.ementa) warnings.push('Não localizei a seção EMENTA.');

  return { data, warnings };
}

export function mergeParsedIntoSyllabus(prev: Record<string, any>, parsed: Record<string, any>): Record<string, any> {
  const next: Record<string, any> = { ...prev };
  for (const key of ['course', 'subject', 'professor', 'period', 'semester', 'matrixYear', 'syllabusText', 'methodologyCustom', 'evaluationCustom']) {
    if (parsed[key]) next[key] = parsed[key];
  }
  if (parsed.methodologyCustom) next.methodologyType = 'custom';
  if (parsed.evaluationCustom) next.evaluationType = 'custom';
  if (parsed.workload) next.workload = { ...prev.workload, ...parsed.workload };
  for (const key of ['competencies', 'objectives', 'complementaryBibliography', 'materials', 'basicBibliography', 'programContent']) {
    if (parsed[key] && parsed[key].length) next[key] = parsed[key];
  }
  return next;
}
