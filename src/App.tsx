import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { extractTextFromFile, parseSyllabusText, mergeParsedIntoSyllabus, COURSES_LIST } from './lib/syllabusImport';

// Presets de Texto Base da Afya (Magenta institucional)
const METHODOLOGY_PRESET_PRESENCIAL =
  "Todas as disciplinas presenciais do Grupo Afya Educacional são estruturalmente iguais, possuindo 22 (vinte e duas) semanas, sendo 20 (vinte) de conteúdo e 2 (duas) de aplicação de avaliações. O professor da disciplina é responsável pelo conteúdo, seguindo o plano de ensino proposto. O professor da disciplina é responsável pela elaboração, aplicação e correção das avaliações teóricas e das atividades com uso de metodologias ativas.";

const METHODOLOGY_PRESET_ONLINE_ASSINCRONA =
  "Uma disciplina online assíncrona é caracterizada por possuir toda a sua oferta online, de modo que todo o conteúdo está produzido e disponível para o aluno no Ambiente Virtual de Aprendizagem (AVA) podendo ser acessado no tempo que o aluno se programar para estudar. Mesmo tratando-se de uma disciplina, conceitualmente, assíncrona, o Grupo Afya Educacional oferece \"Aulas ao Vivo\" com o professor tutor da disciplina, nas quais os estudantes têm a oportunidade de sanar dúvidas do conteúdo, além de interagir com o tutor e demais colegas. Com isso, há uma proximidade maior e melhor relação tutor-acadêmico. Todas as disciplinas online assíncronas do Grupo Afya Educacional são estruturalmente iguais, divididas em 04 unidades de aprendizagem. Cada semana possui um arquivo com o conteúdo e uma videoaula. Também serão realizados 2 roteiros de atividades, a serem entregues pelos estudantes. A cada período de 15 (quinze) dias, é realizado um encontro síncrono com a proposta de analisar temas referentes as unidades de aprendizagem, 2 unidades por encontro.";

const METHODOLOGY_PRESET_HIBRIDA =
  "A disciplina híbrida é a junção do e-learning com o presencial. Ela é caracterizada por possuir um conteúdo (produzido por um professor conteudista do Grupo AFYA) disponibilizado no Ambiente Virtual de Aprendizagem (AVA) que dá base teórica ao acadêmico antes deste ir para o momento presencial, trabalhando com o conceito de sala de aula invertida. Todas as disciplinas híbridas do Grupo Afya Educacional são estruturalmente iguais, possuindo 22 (vinte e duas) semanas de conteúdo divididas em 4 (quatro) módulos. Cada semana possui um arquivo com o conteúdo. Dentro do conteúdo da semana, também se tem uma estrutura padrão de aula, contendo: Apresentação, Conteúdo, Você Sabia?, Sintetizando, Atividade e Referências.";

const METHODOLOGY_PRESETS = {
  presencial: METHODOLOGY_PRESET_PRESENCIAL,
  online_assincrona: METHODOLOGY_PRESET_ONLINE_ASSINCRONA,
  hibrida: METHODOLOGY_PRESET_HIBRIDA
};

const EVALUATION_PRESET_PRESENCIAL =
  "Apresentamos a seguir a distribuição dos pontos para cada atividade avaliativa, tendo como nota máxima 100 pontos:\n\n• Atividade elaborada pelo professor: O docente da disciplina elaborará e corrigirá uma atividade (ou conjunto delas) tanto para N1 quanto para N2.\n\n• Avaliações teóricas: O professor responsável pela disciplina elaborará, aplicará e corrigirá as avaliações teóricas tanto para N1 quanto para N2.\n\n• A distribuição desses pontos pode ser realizada em mais de uma atividade e avaliação dentro de cada etapa (N1 e N2).\n\n• Em cada etapa, N1 e N2, a pontuação máxima será de 50 pontos, distribuída entre a(s) atividade(s) e a avaliação teórica.\n\n• A nota semestral será composta pela soma de N1 e N2 (Nota Semestral = N1 + N2), totalizando 100 pontos.\n\n• A Nota semestral (Média) para aprovação é de 70 pontos. E possuirá direito a Exame Final o aluno que obtiver na soma de N1 + N2 acima de 40 pontos.\n\n• O Exame final valerá 100 pontos, e será aplicado apenas para quem não atingiu 70 pontos e somando em N1 + N2 obteve acima de 40 pontos.\n\n• O aluno que já se encontra APROVADO na soma de N1 + N2 NÃO está apto a realização do Exame Final.\n\n• Aluno será considerado APTO ao EXAME FINAL APENAS se obteve acima de 40 PONTOS na soma de N1 + N2.\n\n• O aluno que NÃO obteve 40 pontos na soma de N1 + N2 será REPROVADO sem direito a Exame Final.";

const EVALUATION_PRESET_HIBRIDA =
  "Para cursos sem TPI:\n\n45 pontos de N1\n• 15 pontos (15%) de atividade\n• 30 pontos (30%) de provas\n\n55 pontos de N2\n• 10 pontos (10%) do Simulado (atividade de autocorreção dentro do Canvas)\n• 5 pontos (5%) de atividade\n• 10 pontos (10%) de atividade\n• 30 pontos (30%) de provas\n\nPara cursos com TPI:\n\n45 pontos de N1\n• 15 pontos (15%) de atividade\n• 30 pontos (30%) de provas\n\n55 pontos de N2\n• 10 pontos (10%) do Simulado (atividade de autocorreção dentro do Canvas)\n• 5 pontos (5%) de atividade\n• 10 pontos (10%) de atividade\n• 20 pontos prova elaborada e corrigida pelo professor (20%)\n• 10 pontos do TPI (10%)";

const EVALUATION_PRESET_ONLINE_ASSINCRONA =
  "A avaliação da disciplina é composta por atividades realizadas ao longo do período letivo e por uma avaliação presencial. A nota da N1 é formada pelo Roteiro de Atividade 1, com valor de até 20 pontos, referente à Unidade 1, e pelo Roteiro de Atividade 2, com valor de até 25 pontos, contemplando as Unidades 1 e 2. Ambas as atividades são realizadas de forma online, por meio do Canvas, conforme as orientações disponibilizadas na disciplina.\n\nA N2 corresponde à Avaliação Final, com valor de até 55 pontos, abrangendo todo o conteúdo da disciplina. Essa avaliação é realizada presencialmente na unidade ou polo de apoio e exige agendamento prévio obrigatório, que deverá ser realizado dentro dos prazos estabelecidos no calendário acadêmico.\n\nOs estudantes que obtiverem média igual ou superior a 70 pontos estarão aprovados. Aqueles que obtiverem média inferior a 40 pontos estarão reprovados. Já os estudantes que alcançarem média entre 40 e 69,9 pontos deverão realizar o Exame Final, que também é presencial, possui valor de até 100 pontos, contempla todo o conteúdo da disciplina e requer agendamento prévio.\n\nA média da disciplina é calculada pela soma das notas da N1 e da N2 (Média = N1 + N2). Caso seja necessária a realização do Exame Final, a média será recalculada da seguinte forma: Média Final = (Média da disciplina + Nota do Exame Final) ÷ 2. Será considerado aprovado o estudante que obtiver Média Final igual ou superior a 60 pontos. Caso a média final seja inferior a esse valor, será necessário cursar novamente a disciplina.";

const EVALUATION_PRESETS = {
  presencial: EVALUATION_PRESET_PRESENCIAL,
  hibrida: EVALUATION_PRESET_HIBRIDA,
  online_assincrona: EVALUATION_PRESET_ONLINE_ASSINCRONA
};

// Formulário em branco (estado inicial e também o que "Limpar Campos" restaura)
const blankSyllabusData = {
  course: COURSES_LIST[0],
  subject: "",
  matrixYear: "",
  logoUrl: `${import.meta.env.BASE_URL}afya-logo.jpg`,
  workload: {
    total: 0,
    theoretical: 0,
    practical: 0,
    internship: 0,
    onlineAsync: 0,
    onlineSync: 0,
    extension: 0
  },
  syllabusText: "",
  competencies: ["", "", "", "", ""],
  objectives: ["", "", "", "", "", ""],
  methodologyType: "custom",
  methodologyCustom: "",
  programContent: [
    { unitName: "UNIDADE 1", themes: [{ title: "", summary: "" }, { title: "", summary: "" }], summary: "" },
    { unitName: "UNIDADE 2", themes: [{ title: "", summary: "" }, { title: "", summary: "" }], summary: "" },
    { unitName: "UNIDADE 3", themes: [{ title: "", summary: "" }, { title: "", summary: "" }], summary: "" },
    { unitName: "UNIDADE 4", themes: [{ title: "", summary: "" }, { title: "", summary: "" }], summary: "" }
  ],
  evaluationType: "custom",
  evaluationCustom: "",
  basicBibliography: [
    { text: "", link: "" },
    { text: "", link: "" },
    { text: "", link: "" }
  ],
  complementaryBibliography: ["", "", "", "", ""],
  materials: ["", ""]
};

export default function App() {
  const [syllabus, setSyllabus] = useState(blankSyllabusData);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' ou 'preview'
  const [activeFormTab, setActiveFormTab] = useState('identificacao');
  const [logoPreview, setLogoPreview] = useState(null);

  // Modal de confirmação customizado para evitar o uso de window.confirm ou window.alert
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingPrintFields, setPendingPrintFields] = useState(null);

  // Importação de Plano de Ensino existente (PDF/DOCX)
  const [isImporting, setIsImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState(null);
  const [importError, setImportError] = useState(null);

  const fileInputRef = useRef(null);
  const documentImportRef = useRef(null);

  // Calcula a quantidade de temas dinâmica por Unidade de acordo com a Carga Horária Total (Regra de imagem)
  const getThemeCount = (hours) => {
    if (hours <= 48) return 2;
    if (hours <= 81) return 3;
    if (hours <= 119) return 4;
    return 5;
  };

  const themeCountExpected = getThemeCount(syllabus.workload.total);

  // Soma de todas as C.H. específicas
  const calculatedSumCH = 
    (syllabus.workload.theoretical || 0) +
    (syllabus.workload.practical || 0) +
    (syllabus.workload.internship || 0) +
    (syllabus.workload.onlineAsync || 0) +
    (syllabus.workload.onlineSync || 0) +
    (syllabus.workload.extension || 0);

  const isCHValid = calculatedSumCH === syllabus.workload.total;
  const doesCHExceed = calculatedSumCH > syllabus.workload.total;

  // Verifica seções essenciais ainda não preenchidas antes de gerar o PDF
  const getPendingPrintFields = () => {
    const pending = [];
    if (!syllabus.subject.trim()) pending.push('Nome da Disciplina');
    if (!syllabus.syllabusText.trim()) pending.push('Ementa');
    if (syllabus.competencies.every(c => !c.trim())) pending.push('Competências');
    if (syllabus.objectives.every(o => !o.trim())) pending.push('Objetivos');
    if (!syllabus.methodologyCustom.trim()) pending.push('Metodologia e Estrutura');
    if (syllabus.programContent.some(u => u.themes.every(t => !t.title.trim()))) pending.push('Temas de alguma Unidade');
    if (!syllabus.evaluationCustom.trim()) pending.push('Sistema de Avaliação');
    if (syllabus.basicBibliography.every(b => !b.text.trim())) pending.push('Bibliografia Básica');
    if (syllabus.complementaryBibliography.every(b => !b.trim())) pending.push('Bibliografia Complementar');
    if (syllabus.materials.every(m => !m.trim())) pending.push('Materiais Complementares');
    return pending;
  };

  const handlePrintClick = () => {
    const pending = getPendingPrintFields();
    if (pending.length > 0) {
      setPendingPrintFields(pending);
    } else {
      window.print();
    }
  };

  // --- Paginação A4 (simulação de quebra de página em mais de uma folha) ---
  // Altura útil de uma página A4 com margem de 13mm (ver @page no CSS abaixo),
  // em pixels a 96dpi: (297mm - 2 * 13mm) * (96/25.4).
  const PAGE_CONTENT_HEIGHT_PX = 1024;
  const PAGE_UNIT_KEYS = [
    'section1', 'section2', 'section3', 'section4', 'section5',
    'section6', 'section7', 'section8-1', 'section8-2', 'section8-3'
  ];
  const unitRefs = useRef(new Map());
  const registerUnitRef = (key, el) => {
    if (el) unitRefs.current.set(key, el);
    else unitRefs.current.delete(key);
  };
  const [pagination, setPagination] = useState({ breaks: {}, totalPages: 1 });

  // Mede a altura real de cada seção renderizada e decide onde forçar quebras de
  // página, garantindo que a contagem total de páginas exibida bata com o PDF
  // gerado (em vez de apenas estimar onde o navegador quebraria naturalmente).
  useLayoutEffect(() => {
    const heights = PAGE_UNIT_KEYS.map(k => unitRefs.current.get(k)?.offsetHeight || 0);

    let used = 0;
    let page = 1;
    const breaks = {};
    heights.forEach((h, i) => {
      if (used > 0 && used + h > PAGE_CONTENT_HEIGHT_PX) {
        page += 1;
        breaks[PAGE_UNIT_KEYS[i]] = { pageNumber: page };
        used = 0;
      }
      if (h > PAGE_CONTENT_HEIGHT_PX) {
        const totalWithThis = used + h;
        page += Math.floor(totalWithThis / PAGE_CONTENT_HEIGHT_PX);
        used = totalWithThis % PAGE_CONTENT_HEIGHT_PX;
      } else {
        used += h;
      }
    });

    setPagination(prev => {
      if (prev.totalPages === page && JSON.stringify(prev.breaks) === JSON.stringify(breaks)) return prev;
      return { breaks, totalPages: page };
    });
  }, [syllabus, activeTab, themeCountExpected]);

  const renderPageBreakBefore = (key) => {
    const breakInfo = pagination.breaks[key];
    if (!breakInfo) return null;
    return (
      <React.Fragment key={`break-${key}`}>
        <div className="flex justify-end text-[9px] text-neutral-400 font-sans mt-2 mb-1">
          Página {breakInfo.pageNumber - 1} de {pagination.totalPages}
        </div>
        <div style={{ breakBefore: 'page' }} className="pt-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="no-print flex-1 border-t-2 border-dashed border-neutral-300"></div>
            <span className="text-[9px] text-neutral-400 font-sans font-bold px-1">Página {breakInfo.pageNumber} de {pagination.totalPages}</span>
            <div className="no-print flex-1 border-t-2 border-dashed border-neutral-300"></div>
          </div>
          <div className="flex flex-wrap justify-between gap-1 text-[9px] text-neutral-500 font-sans border-b border-neutral-300 pb-1 mb-3">
            <span className="font-bold">{syllabus.subject || "Disciplina não informada"}</span>
            <span>Curso: {syllabus.course}</span>
            <span>Matriz: {syllabus.matrixYear || "—"}</span>
          </div>
        </div>
      </React.Fragment>
    );
  };

  // Ajusta o array de temas de cada unidade quando o total de horas muda
  useEffect(() => {
    const expected = getThemeCount(syllabus.workload.total);
    setSyllabus(prev => {
      const updatedContent = prev.programContent.map(unit => {
        const currentThemes = [...(unit.themes || [])];
        if (currentThemes.length === expected) return unit;
        if (currentThemes.length < expected) {
          while (currentThemes.length < expected) {
            currentThemes.push({ title: "", summary: "" });
          }
        } else {
          currentThemes.splice(expected);
        }
        return { ...unit, themes: currentThemes };
      });
      return { ...prev, programContent: updatedContent };
    });
  }, [syllabus.workload.total]);

  const handleChange = (field, value) => {
    setSyllabus(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkloadChange = (field, value) => {
    const val = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    setSyllabus(prev => ({
      ...prev,
      workload: {
        ...prev.workload,
        [field]: val
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setSyllabus(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const handleUnitNameChange = (unitIndex, value) => {
    setSyllabus(prev => {
      const content = [...prev.programContent];
      content[unitIndex] = { ...content[unitIndex], unitName: value };
      return { ...prev, programContent: content };
    });
  };

  const handleThemeChange = (unitIndex, themeIndex, value) => {
    setSyllabus(prev => {
      const content = [...prev.programContent];
      const themes = [...content[unitIndex].themes];
      themes[themeIndex] = { ...themes[themeIndex], title: value };
      content[unitIndex] = { ...content[unitIndex], themes };
      return { ...prev, programContent: content };
    });
  };

  const handleThemeSummaryChange = (unitIndex, themeIndex, value) => {
    setSyllabus(prev => {
      const content = [...prev.programContent];
      const themes = [...content[unitIndex].themes];
      themes[themeIndex] = { ...themes[themeIndex], summary: value };
      content[unitIndex] = { ...content[unitIndex], themes };
      return { ...prev, programContent: content };
    });
  };

  const handleSummaryChange = (unitIndex, value) => {
    setSyllabus(prev => {
      const content = [...prev.programContent];
      content[unitIndex] = { ...content[unitIndex], summary: value };
      return { ...prev, programContent: content };
    });
  };

  const handleBasicBibChange = (index, subField, value) => {
    setSyllabus(prev => {
      const bibs = [...prev.basicBibliography];
      bibs[index] = { ...bibs[index], [subField]: value };
      return { ...prev, basicBibliography: bibs };
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setSyllabus(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await extractTextFromFile(file);
      const { data, warnings } = parseSyllabusText(text);
      setSyllabus(prev => mergeParsedIntoSyllabus(prev, data));
      setImportWarnings(warnings);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const executeReset = () => {
    setSyllabus(blankSyllabusData);
    setLogoPreview(null);
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 flex flex-col font-sans print:bg-white print:text-black relative">
      
      {/* CSS embutido para controle estrito de tamanho de papel e quebra de páginas em formato A4 real */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 13mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-container table {
            border-collapse: collapse !important;
          }
          .print-container tr,
          .print-container li {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-container h3 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .print-container p,
          .print-container li {
            orphans: 3;
            widows: 3;
          }
        }
      `}} />

      {/* MODAIS CUSTOMIZADOS (SEM ALERTS/CONFIRMS) */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="bg-[#D0005F] text-white p-4 font-bold">Aviso de Limpeza</div>
            <div className="p-4 text-sm text-neutral-600">
              Atenção: Todos os dados serão reiniciados para um formulário em branco. Você deseja continuar?
            </div>
            <div className="p-4 bg-neutral-50 flex justify-end gap-2 border-t border-neutral-100">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-neutral-300 rounded text-xs font-semibold hover:bg-neutral-100 transition text-neutral-700"
              >
                Cancelar
              </button>
              <button 
                onClick={executeReset}
                className="px-4 py-2 bg-[#D0005F] hover:bg-[#b0004f] text-white rounded text-xs font-semibold transition"
              >
                Confirmar e Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {importWarnings !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="bg-[#D0005F] text-white p-4 font-bold">Importação Concluída</div>
            <div className="p-4 text-sm text-neutral-600 max-h-[50vh] overflow-y-auto">
              {importWarnings.length === 0 ? (
                <p>Todos os campos reconhecidos foram preenchidos automaticamente. Revise o formulário antes de salvar ou imprimir.</p>
              ) : (
                <>
                  <p className="mb-2">Documento importado. Alguns pontos precisam de revisão manual:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {importWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </>
              )}
            </div>
            <div className="p-4 bg-neutral-50 flex justify-end border-t border-neutral-100">
              <button
                onClick={() => setImportWarnings(null)}
                className="px-4 py-2 bg-[#D0005F] hover:bg-[#b0004f] text-white rounded text-xs font-semibold transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {importError && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="bg-rose-700 text-white p-4 font-bold">Erro ao Importar</div>
            <div className="p-4 text-sm text-neutral-600">{importError}</div>
            <div className="p-4 bg-neutral-50 flex justify-end border-t border-neutral-100">
              <button
                onClick={() => setImportError(null)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPrintFields !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="bg-amber-600 text-white p-4 font-bold">Campos Pendentes</div>
            <div className="p-4 text-sm text-neutral-600">
              <p className="mb-2">Os seguintes campos ainda não foram preenchidos:</p>
              <ul className="list-disc pl-5 space-y-1">
                {pendingPrintFields.map((field, i) => <li key={i}>{field}</li>)}
              </ul>
              <p className="mt-3">Deseja gerar o PDF assim mesmo?</p>
            </div>
            <div className="p-4 bg-neutral-50 flex justify-end gap-2 border-t border-neutral-100">
              <button
                onClick={() => setPendingPrintFields(null)}
                className="px-4 py-2 border border-neutral-300 rounded text-xs font-semibold hover:bg-neutral-100 transition text-neutral-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPendingPrintFields(null);
                  setTimeout(() => window.print(), 50);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition"
              >
                Gerar Assim Mesmo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DO SISTEMA - Tom Magenta Oficial Afya (#D0005F) */}
      <header className="bg-[#D0005F] text-white p-4 shadow-lg flex flex-wrap justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg shadow-inner">
            <img src={`${import.meta.env.BASE_URL}afya-logo.jpg`} alt="Afya Logo" className="h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AfyaPlan</h1>
            <p className="text-xs text-rose-100">Padronizador Oficial de Planos de Ensino</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <input
            type="file"
            accept=".pdf,.docx"
            ref={documentImportRef}
            onChange={handleDocumentImport}
            className="hidden"
          />
          <button
            onClick={() => documentImportRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-rose-300 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-60"
          >
            {isImporting ? 'Importando...' : 'Importar PDF/DOCX'}
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'edit' ? 'bg-white text-[#D0005F] shadow' : 'text-white hover:bg-rose-700'}`}
          >
            Editar Formulário
          </button>
          
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'preview' ? 'bg-white text-[#D0005F] shadow' : 'text-white hover:bg-rose-700'}`}
          >
            Visualizar A4
          </button>

          <button
            onClick={handlePrintClick}
            disabled={!isCHValid}
            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition shadow ${isCHValid ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-neutral-400 text-neutral-200 cursor-not-allowed'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir PDF
          </button>
        </div>
      </header>

      {}
      {/* ÁREA DE TRABALHO */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:block">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE EDIÇÃO */}
        <div className={`lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200 shadow-md flex flex-col gap-5 no-print ${activeTab === 'preview' ? 'hidden lg:flex' : ''}`}>
          
          <div className="border-b border-neutral-200 pb-3 flex justify-between items-center">
            <h2 className="text-md font-bold text-[#D0005F] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D0005F]"></span>
              Estruturação e Regras do Plano
            </h2>
            <button 
              onClick={() => setShowResetModal(true)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
            >
              Limpar Campos
            </button>
          </div>

          {/* Abas internas do formulário de preenchimento */}
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveFormTab('identificacao')}
              className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition ${activeFormTab === 'identificacao' ? 'bg-white text-[#D0005F] shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              ID & Horas
            </button>
            <button
              onClick={() => setActiveFormTab('conteudo-pedagogico')}
              className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition ${activeFormTab === 'conteudo-pedagogico' ? 'bg-white text-[#D0005F] shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Pedagógico
            </button>
            <button
              onClick={() => setActiveFormTab('conteudo-programatico')}
              className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition ${activeFormTab === 'conteudo-programatico' ? 'bg-white text-[#D0005F] shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Unidades ({themeCountExpected})
            </button>
            <button
              onClick={() => setActiveFormTab('bibliografia')}
              className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition ${activeFormTab === 'bibliografia' ? 'bg-white text-[#D0005F] shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Referências
            </button>
          </div>

          {/* FORM CONTEÚDO */}
          <div className="space-y-6 overflow-y-auto max-h-[72vh] pr-2 custom-scrollbar">
            
            {activeFormTab === 'identificacao' && (
              <div className="space-y-4">
                
                <div className="bg-rose-50 p-4 border-l-4 border-[#D0005F] rounded-r-md">
                  <h4 className="text-xs font-bold text-[#D0005F] mb-1">Logo Institucional Padrão</h4>
                  <p className="text-[11px] text-neutral-600 mb-2">A logo padrão da Afya já vem pré-carregada. Caso deseje alterar, selecione uma nova imagem.</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-[#D0005F] text-[#D0005F] hover:bg-rose-100 rounded text-xs font-semibold shadow-sm transition"
                    >
                      Trocar Logotipo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Curso (Combo Box)</label>
                    <select
                      value={syllabus.course}
                      onChange={(e) => handleChange('course', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-[#D0005F]"
                    >
                      {COURSES_LIST.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Nome da Disciplina</label>
                    <input 
                      type="text" 
                      value={syllabus.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      placeholder="Ex: Análise de Balanços"
                      className="w-full p-2 border border-neutral-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Matriz Curricular</label>
                    <input 
                      type="text" 
                      value={syllabus.matrixYear}
                      onChange={(e) => handleChange('matrixYear', e.target.value)}
                      placeholder="Ex: 2027"
                      className="w-full p-2 border border-neutral-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* PAINEL REGRA CARGA HORÁRIA */}
                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#D0005F]">Cargas Horárias (Regra Estrita)</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-0.5">Carga Horária Total (h)</label>
                    <input 
                      type="number" 
                      value={syllabus.workload.total === 0 ? "" : syllabus.workload.total}
                      onChange={(e) => handleWorkloadChange('total', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded text-xs font-bold text-[#D0005F]"
                    />
                  </div>

                  <div className="text-xs p-2.5 rounded font-medium flex items-center justify-between transition-colors">
                    <span>Soma Cadastrada: <strong className={isCHValid ? 'text-emerald-700' : 'text-rose-600'}>{calculatedSumCH}h</strong> de <strong>{syllabus.workload.total}h</strong></span>
                    {isCHValid ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">VÁLIDO</span>
                    ) : doesCHExceed ? (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">EXTRAPOLOU</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">FALTAM HORAS</span>
                    )}
                  </div>

                  {doesCHExceed && (
                    <p className="text-[10px] text-rose-600 font-semibold">⚠️ A soma das cargas horárias parciais NÃO pode extrapolar a carga horária total cadastrada.</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-500">C.H. Teórica</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.theoretical}
                        onChange={(e) => handleWorkloadChange('theoretical', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-500">C.H. Prática</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.practical}
                        onChange={(e) => handleWorkloadChange('practical', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-500">C.H. Estágio</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.internship}
                        onChange={(e) => handleWorkloadChange('internship', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-500">Online Assíncrona</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.onlineAsync}
                        onChange={(e) => handleWorkloadChange('onlineAsync', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-500">Online Síncrona</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.onlineSync}
                        onChange={(e) => handleWorkloadChange('onlineSync', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-500">Online Extensão</label>
                      <input 
                        type="number" 
                        value={syllabus.workload.extension}
                        onChange={(e) => handleWorkloadChange('extension', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded"
                      />
                    </div>
                  </div>

                </div>

              </div>
            )}

            {}
            {activeFormTab === 'conteudo-pedagogico' && (
              <div className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Ementa (Estudo de conteúdos, ferramentas, etc.)</label>
                  <textarea 
                    rows="4"
                    value={syllabus.syllabusText}
                    onChange={(e) => handleChange('syllabusText', e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-[#D0005F] focus:outline-none"
                    placeholder="Cole ou redija o texto da ementa..."
                  />
                </div>

                <div className="bg-rose-50 p-4 border border-neutral-200 rounded-lg">
                  <h4 className="text-xs font-bold text-[#D0005F] uppercase mb-2">5 Competências Solicitadas</h4>
                  <div className="space-y-2">
                    {syllabus.competencies.map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-[#D0005F]">{i+1}º</span>
                        <input 
                          type="text" 
                          value={c}
                          onChange={(e) => handleArrayChange('competencies', i, e.target.value)}
                          placeholder={`Competência número ${i+1}`}
                          className="flex-1 p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-rose-50 p-4 border border-neutral-200 rounded-lg">
                  <h4 className="text-xs font-bold text-[#D0005F] uppercase mb-1">6 Objetivos da Disciplina</h4>
                  <p className="text-[10px] text-neutral-500 mb-2">O preenchimento do 6º objetivo é facultativo.</p>
                  <div className="space-y-2">
                    {syllabus.objectives.map((o, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-[#D0005F]">{i+1}º</span>
                        <input 
                          type="text" 
                          value={o}
                          onChange={(e) => handleArrayChange('objectives', i, e.target.value)}
                          placeholder={`Objetivo número ${i+1}`}
                          className="flex-1 p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-neutral-600">Metodologia e Estrutura</label>
                    <select
                      value={syllabus.methodologyType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSyllabus(prev => ({
                          ...prev,
                          methodologyType: val,
                          methodologyCustom: METHODOLOGY_PRESETS[val] || ""
                        }));
                      }}
                      className="p-1 border border-neutral-300 rounded text-[10px] bg-white font-semibold text-[#D0005F]"
                    >
                      <option value="presencial">Padrão Afya - Presencial</option>
                      <option value="online_assincrona">Padrão Afya - Online Assíncrona</option>
                      <option value="hibrida">Padrão Afya - Híbrida</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <textarea 
                    rows="4"
                    value={syllabus.methodologyCustom}
                    onChange={(e) => handleChange('methodologyCustom', e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-[#D0005F] focus:outline-none"
                    placeholder="Preencha as abordagens de metodologias ativas, semanas letivas..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-neutral-600">Sistema de Avaliação</label>
                    <select
                      value={syllabus.evaluationType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSyllabus(prev => ({
                          ...prev,
                          evaluationType: val,
                          evaluationCustom: EVALUATION_PRESETS[val] || ""
                        }));
                      }}
                      className="p-1 border border-neutral-300 rounded text-[10px] bg-white font-semibold text-[#D0005F]"
                    >
                      <option value="presencial">Padrão Afya - Presencial</option>
                      <option value="hibrida">Padrão Afya - Híbrida</option>
                      <option value="online_assincrona">Padrão Afya - Online Assíncrona</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <textarea 
                    rows="4"
                    value={syllabus.evaluationCustom}
                    onChange={(e) => handleChange('evaluationCustom', e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-[#D0005F] focus:outline-none"
                    placeholder="Distribuição de notas e pesos..."
                  />
                </div>

              </div>
            )}

            {}
            {activeFormTab === 'conteudo-programatico' && (
              <div className="space-y-4">
                
                <div className="bg-rose-50 p-3 rounded border border-rose-100 text-xs text-rose-950 leading-relaxed font-sans">
                  <strong>Regra de Unidades:</strong> O Conteúdo Programático é fixado em 4 unidades. 
                  Com a Carga Horária de <span className="font-bold">{syllabus.workload.total}h</span>, o sistema solicita automaticamente **{themeCountExpected} temas por unidade**, além de 1 campo de resumo de tema.
                </div>

                <div className="space-y-4">
                  {syllabus.programContent.map((unit, unitIdx) => (
                    <div key={unitIdx} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#D0005F]">Unidade {unitIdx + 1}</span>
                        <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-bold">
                          {themeCountExpected} Temas Solicitados
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">Título / Nome da Unidade</label>
                        <input 
                          type="text" 
                          value={unit.unitName}
                          onChange={(e) => handleUnitNameChange(unitIdx, e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded text-xs font-semibold"
                          placeholder={`Ex: UNIDADE ${unitIdx + 1} - INTRODUÇÃO`}
                        />
                      </div>

                      <div className="space-y-3">
                        <span className="block text-[10px] font-bold text-neutral-500 uppercase">Lista de Temas</span>
                        {unit.themes.map((theme, themeIdx) => (
                          <div key={themeIdx} className="space-y-1 pb-2 border-b border-neutral-200 last:border-b-0 last:pb-0">
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-bold text-neutral-400">Tema {themeIdx + 1}:</span>
                              <input
                                type="text"
                                value={theme.title}
                                onChange={(e) => handleThemeChange(unitIdx, themeIdx, e.target.value)}
                                className="flex-1 p-1.5 border border-neutral-300 rounded text-xs"
                                placeholder={`Título do Tema ${themeIdx + 1}`}
                              />
                            </div>
                            <textarea
                              rows="2"
                              value={theme.summary}
                              onChange={(e) => handleThemeSummaryChange(unitIdx, themeIdx, e.target.value)}
                              className="w-full p-1.5 border border-neutral-300 rounded text-xs"
                              placeholder={`Texto de resumo do tema ${themeIdx + 1}...`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">Resumo Curto da Unidade</label>
                        <textarea 
                          rows="2"
                          value={unit.summary}
                          onChange={(e) => handleSummaryChange(unitIdx, e.target.value)}
                          className="w-full p-1.5 border border-neutral-300 rounded text-xs"
                          placeholder="Breve resumo da contextualização pedagógica desta unidade..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {}
            {activeFormTab === 'bibliografia' && (
              <div className="space-y-4">
                
                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#D0005F] uppercase">3 Bibliografias Básicas</h4>
                    <p className="text-[10px] text-neutral-500">Formatação padrão ABNT com link dedicado de acesso à Minha Biblioteca.</p>
                  </div>
                  
                  {syllabus.basicBibliography.map((bib, idx) => (
                    <div key={idx} className="p-3 bg-white border border-neutral-200 rounded space-y-2">
                      <span className="text-xs font-bold text-[#D0005F]">Referência {idx + 1}</span>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500">Referência ABNT</label>
                        <input 
                          type="text" 
                          value={bib.text}
                          onChange={(e) => handleBasicBibChange(idx, 'text', e.target.value)}
                          placeholder="SOBRENOME, Nome. Título do Livro. Edição. Cidade: Editora, Ano."
                          className="w-full p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500">Link Minha Biblioteca</label>
                        <input 
                          type="text" 
                          value={bib.link}
                          onChange={(e) => handleBasicBibChange(idx, 'link', e.target.value)}
                          placeholder="https://minhabiblioteca.com.br/isbn/..."
                          className="w-full p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg">
                  <h4 className="text-xs font-bold text-[#D0005F] uppercase mb-3">5 Bibliografias Complementares</h4>
                  <div className="space-y-3">
                    {syllabus.complementaryBibliography.map((bib, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500">Bibliografia {idx + 1}</label>
                        <input 
                          type="text" 
                          value={bib}
                          onChange={(e) => handleArrayChange('complementaryBibliography', idx, e.target.value)}
                          placeholder="SOBRENOME, Nome. Título do Livro. Edição. Cidade, Ano."
                          className="w-full p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg">
                  <h4 className="text-xs font-bold text-[#D0005F] uppercase mb-3">2 Materiais Complementares (Artigos/Vídeos)</h4>
                  <div className="space-y-3">
                    {syllabus.materials.map((mat, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500">Material de Apoio {idx + 1}</label>
                        <textarea 
                          rows="2"
                          value={mat}
                          onChange={(e) => handleArrayChange('materials', idx, e.target.value)}
                          placeholder="Indicação de Artigo Científico, Periódico, Dissertação ou Vídeo Institucional..."
                          className="w-full p-2 border border-neutral-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {}
        {/* COLUNA DIREITA: LIVE PREVIEW MODELO A4 (Fidelidade visual extrema) */}
        <div className={`lg:col-span-7 flex flex-col items-center print:block ${activeTab === 'edit' ? 'hidden lg:flex' : ''}`}>
          
          <div className="w-full max-w-[800px] mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-[#D0005F] flex justify-between items-center no-print shadow-sm">
            <span className="flex items-center gap-1.5 font-medium leading-relaxed">
              <svg className="w-4 h-4 flex-shrink-0 text-[#D0005F]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <span><strong>Visualização do Padrão Institucional:</strong> Diagramado em tamanho real e tom magenta Afya para exportação limpa.</span>
            </span>
            {!isCHValid && (
              <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-[10px] font-bold tracking-tight">
                CORRIJA AS HORAS PARA IMPRIMIR
              </span>
            )}
          </div>

          {/* SIMULAÇÃO DE FOLHA A4 ACADÊMICA */}
          <div className="print-container w-full max-w-[800px] bg-white border border-neutral-300 shadow-2xl p-[50px] text-black font-serif text-xs leading-relaxed min-h-[1130px] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:max-w-full print:min-h-0">
            
            {}
            <div>
              {/* CABEÇALHO INSTITUCIONAL GERAL (Magenta Afya) */}
              <div className="border-b-2 border-[#D0005F] pb-4 mb-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-sm font-bold uppercase tracking-tight font-sans text-neutral-900 leading-tight">
                    GRUPO AFYA EDUCACIONAL
                  </h2>
                  <p className="text-[10px] font-bold text-neutral-500 font-sans mt-0.5 uppercase tracking-wide">
                    {syllabus.course ? `Curso de Bacharelado em ${syllabus.course}` : "CURSO NÃO SELECIONADO"}
                  </p>
                  <p className="text-base font-extrabold font-sans text-[#D0005F] mt-1.5 tracking-tight uppercase">
                    PLANO DE ENSINO
                  </p>
                </div>
                
                {/* ESPAÇO PARA O LOGOTIPO */}
                <div className="w-[110px] h-[60px] border border-neutral-200 flex items-center justify-center bg-white overflow-hidden shrink-0 rounded p-1">
                  {logoPreview || syllabus.logoUrl ? (
                    <img src={logoPreview || syllabus.logoUrl} alt="Logo Institucional" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-[9px] text-[#D0005F] font-sans font-bold text-center p-1 uppercase flex flex-col items-center">
                      AFYA
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 1 */}
              <div ref={el => registerUnitRef('section1', el)} className="mb-5 break-inside-avoid">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  1. IDENTIFICAÇÃO DA DISCIPLINA
                </h3>
                
                <table className="w-full border-collapse border border-neutral-400 text-[11px] font-sans">
                  <tbody>
                    <tr>
                      <td className="border border-neutral-400 p-1.5 font-bold bg-neutral-50 w-1/4 text-neutral-700">Disciplina:</td>
                      <td className="border border-neutral-400 p-1.5 font-medium uppercase text-neutral-950" colSpan="3">
                        {syllabus.subject || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-400 p-1.5 font-bold bg-neutral-50 w-1/4 text-neutral-700">Curso:</td>
                      <td className="border border-neutral-400 p-1.5 text-neutral-950" colSpan="1">{syllabus.course}</td>
                      <td className="border border-neutral-400 p-1.5 font-bold bg-neutral-50 w-1/5 text-neutral-700">Matriz Curricular:</td>
                      <td className="border border-neutral-400 p-1.5 text-neutral-950">{syllabus.matrixYear || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-400 p-1.5 font-bold bg-rose-50 text-[#D0005F]" colSpan="2">
                        CARGA HORÁRIA TOTAL DA DISCIPLINA:
                      </td>
                      <td className="border border-neutral-400 p-1.5 font-extrabold bg-rose-50 text-[#D0005F] text-center text-xs" colSpan="2">
                        {syllabus.workload.total} Horas-Aula
                      </td>
                    </tr>
                    <tr className="text-[10px] text-neutral-600 bg-neutral-50">
                      <td className="border border-neutral-400 p-1 text-center font-bold">
                        C.H. Teórica: {syllabus.workload.theoretical || 0}h
                      </td>
                      <td className="border border-neutral-400 p-1 text-center font-bold">
                        C.H. Prática: {syllabus.workload.practical || 0}h
                      </td>
                      <td className="border border-neutral-400 p-1 text-center font-bold" colSpan="2">
                        Estágio: {syllabus.workload.internship || 0}h | EaD: {(syllabus.workload.onlineAsync || 0) + (syllabus.workload.onlineSync || 0)}h | Ext: {syllabus.workload.extension || 0}h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {renderPageBreakBefore('section2')}
              {/* Seção 2 */}
              <div ref={el => registerUnitRef('section2', el)} className="mb-5 break-inside-avoid text-justify text-neutral-800">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  2. EMENTA DA DISCIPLINA
                </h3>
                <p className="font-serif leading-relaxed whitespace-pre-line text-[11px] pl-1 pr-1">
                  {syllabus.syllabusText || "Nenhuma ementa digitada."}
                </p>
              </div>

              {renderPageBreakBefore('section3')}
              {/* Seção 3 */}
              <div ref={el => registerUnitRef('section3', el)} className="mb-5 break-inside-avoid">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  3. COMPETÊNCIAS A SEREM DESENVOLVIDAS
                </h3>
                <ul className="list-decimal pl-5 font-serif text-[11px] text-neutral-800 space-y-1">
                  {syllabus.competencies.filter(c => c.trim() !== "").map((comp, idx) => (
                    <li key={idx} className="text-justify">{comp}</li>
                  ))}
                  {syllabus.competencies.filter(c => c.trim() !== "").length === 0 && (
                    <li className="list-none text-neutral-400 italic">Nenhuma competência preenchida.</li>
                  )}
                </ul>
              </div>

              {renderPageBreakBefore('section4')}
              {/* Seção 4 */}
              <div ref={el => registerUnitRef('section4', el)} className="mb-5 break-inside-avoid">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  4. OBJETIVOS DA DISCIPLINA
                </h3>
                <ul className="list-disc pl-5 font-serif text-[11px] text-neutral-800 space-y-1">
                  {syllabus.objectives.filter(o => o.trim() !== "").map((obj, idx) => (
                    <li key={idx} className="text-justify">{obj}</li>
                  ))}
                  {syllabus.objectives.filter(o => o.trim() !== "").length === 0 && (
                    <li className="list-none text-neutral-400 italic">Nenhum objetivo preenchido.</li>
                  )}
                </ul>
              </div>

              {renderPageBreakBefore('section5')}
              {/* Seção 5 */}
              <div ref={el => registerUnitRef('section5', el)} className="mb-5 break-inside-avoid text-justify text-neutral-800">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  5. PROCEDIMENTOS METODOLÓGICOS E ESTRUTURA
                </h3>
                <p className="font-serif leading-relaxed whitespace-pre-line text-[11px] pl-1 pr-1">
                  {syllabus.methodologyCustom || "Nenhuma metodologia selecionada ou redigida."}
                </p>
              </div>

              {renderPageBreakBefore('section6')}
              {/* Seção 6 */}
              <div ref={el => registerUnitRef('section6', el)} className="mb-5">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  6. CONTEÚDO PROGRAMÁTICO E DIVISÃO DE TEMAS
                </h3>
                
                <table className="w-full border-collapse border border-neutral-400 text-[11px] font-sans">
                  <thead>
                    <tr className="bg-neutral-100 font-bold text-neutral-800 text-left">
                      <th className="border border-neutral-400 p-2 w-1/4">Unidade / Contexto</th>
                      <th className="border border-neutral-400 p-2 w-3/4">Tópicos e Temas Abordados ({themeCountExpected} por unidade)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syllabus.programContent.map((unit, unitIdx) => (
                      <tr key={unitIdx} className="align-top">
                        <td className="border border-neutral-400 p-2 font-bold text-[#D0005F] bg-neutral-50">
                          {unit.unitName || `UNIDADE ${unitIdx+1}`}
                        </td>
                        <td className="border border-neutral-400 p-2 space-y-2">
                          <ol className="list-decimal pl-4 font-sans text-neutral-800 space-y-1.5">
                            {unit.themes.map((theme, themeIdx) => (
                              <li key={themeIdx} className="font-medium text-neutral-950">
                                {theme.title || <span className="text-neutral-400 italic">[Tema não preenchido]</span>}
                                {theme.summary && (
                                  <div className="font-serif font-normal italic text-[10px] text-neutral-500 mt-0.5 whitespace-pre-line">
                                    {theme.summary}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                          {unit.summary && (
                            <div className="mt-2 pt-1 border-t border-neutral-200 text-[10px] text-neutral-500 font-serif italic whitespace-pre-line">
                              <strong>Contexto geral:</strong> {unit.summary}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {renderPageBreakBefore('section7')}
              {/* Seção 7 */}
              <div ref={el => registerUnitRef('section7', el)} className="mb-5 break-inside-avoid text-justify text-neutral-800">
                <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-2 tracking-wide">
                  7. CRITÉRIOS DE AVALIAÇÃO DO APRENDIZADO
                </h3>
                <p className="font-serif leading-relaxed whitespace-pre-line text-[11px] pl-1 pr-1">
                  {syllabus.evaluationCustom || "Nenhum sistema de avaliação de pontos descrito."}
                </p>
              </div>

              {/* Seção 8 */}
              <div className="mb-6 text-neutral-800">
                {renderPageBreakBefore('section8-1')}
                <div ref={el => registerUnitRef('section8-1', el)} className="mb-3 break-inside-avoid">
                  <h3 className="text-[11px] font-extrabold uppercase font-sans text-white bg-[#D0005F] px-2 py-1 mb-3 tracking-wide">
                    8. REFERÊNCIAS BIBLIOGRÁFICAS
                  </h3>
                  <h4 className="text-[10px] font-bold font-sans uppercase text-neutral-600 mb-1">
                    8.1 Bibliografia Básica (3 Títulos Obrigatórios com Acesso Digital)
                  </h4>
                  <ul className="list-none pl-0 font-serif text-[11px] space-y-2">
                    {syllabus.basicBibliography.map((bib, idx) => (
                      <li key={idx} className="text-justify pl-4 -indent-4">
                        <strong>[{idx + 1}]</strong> {bib.text || "—"}
                        {bib.link && (
                          <span className="block text-[9px] text-[#D0005F] font-sans select-all font-medium break-all">
                            Acesso via Minha Biblioteca: <span className="underline">{bib.link}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {renderPageBreakBefore('section8-2')}
                <div ref={el => registerUnitRef('section8-2', el)} className="mb-3 break-inside-avoid">
                  <h4 className="text-[10px] font-bold font-sans uppercase text-neutral-600 mb-1">
                    8.2 Bibliografia Complementar (5 Títulos)
                  </h4>
                  <ul className="list-none pl-0 font-serif text-[11px] space-y-1.5">
                    {syllabus.complementaryBibliography.map((bib, idx) => (
                      <li key={idx} className="text-justify pl-4 -indent-4">
                        <strong>[{idx + 1}]</strong> {bib || "—"}
                      </li>
                    ))}
                  </ul>
                </div>

                {renderPageBreakBefore('section8-3')}
                <div ref={el => registerUnitRef('section8-3', el)} className="break-inside-avoid">
                  <h4 className="text-[10px] font-bold font-sans uppercase text-neutral-600 mb-1">
                    8.3 Materiais Complementares recomendados (2 Artigos/Leituras de Apoio)
                  </h4>
                  <ul className="list-none pl-0 font-serif text-[11px] space-y-1.5">
                    {syllabus.materials.map((mat, idx) => (
                      <li key={idx} className="text-justify pl-4 -indent-4 whitespace-pre-line break-words">
                        <strong>[{idx + 1}]</strong> {mat || "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-end text-[9px] text-neutral-400 font-sans mt-3">
                  Página {pagination.totalPages} de {pagination.totalPages}
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}