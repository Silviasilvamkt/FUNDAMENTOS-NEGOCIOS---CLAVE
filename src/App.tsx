/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  FileDown, 
  CheckCircle2,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Data Structure ---
interface Question {
  id: string;
  text: string;
  explanation?: string;
  required?: boolean;
}

interface Phase {
  id: number;
  title: string;
  questions: Question[];
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: "FASE 1: Propuesta de Valor",
    questions: [
      { id: "q1_1", text: "¿Qué ofreces o vendes?", explanation: "Describe en una frase sencilla qué producto o servicio ofreces. Ejemplo: 'Hago uñas a domicilio' o 'Vendo pasteles por WhatsApp'.", required: true },
      { id: "q1_2", text: "¿A quién le vendes? (tu cliente ideal)", explanation: "Piensa en la persona que más te compra o que te gustaría que te compre. Ejemplo: 'Mujeres de 25-40 años en mi ciudad'.", required: true },
      { id: "q1_3", text: "¿Qué problema resuelves?", required: true },
      { id: "q1_4", text: "¿Por qué la gente te compra?", required: false },
      { id: "q1_5", text: "¿Qué necesidad o problema solucionas?", explanation: "Ejemplo: 'Ayudo a que las personas tengan uñas bonitas sin salir de casa'.", required: false },
    ]
  },
  {
    id: 2,
    title: "FASE 2: Identidad del Negocio",
    questions: [
      { id: "q2_1", text: "¿Cuál es el nombre y la descripción completa de tu negocio o marca personal?", explanation: "Escribe el nombre legal y comercial de tu empresa, y una descripción clara de lo que hace y su propuesta de valor.", required: true },
      { id: "q2_2", text: "¿En qué industria/sector específico operas y cuál es tu modelo de negocio?", explanation: "(opcional) Describe el sector económico al que perteneces y cómo generas ingresos (B2B, B2C, servicios, productos, etc.).", required: false },
      { id: "q2_3", text: "¿Cuál es tu mercado geográfico objetivo y el tamaño aproximado de tu empresa?", explanation: "(opcional) Indica en qué regiones vendes y cuántos empleados o colaboradores tienes, si aplica.", required: false },
      { id: "q2_4", text: "¿Cuáles son tus productos o servicios principales?", explanation: "(opcional) Enumera los productos o servicios más importantes que ofreces.", required: false },
      { id: "q2_5", text: "¿Cuál es tu modelo de ingresos y estructura de precios?", explanation: "(opcional) Explica cómo cobras a tus clientes y si tienes precios fijos, variables, suscripciones, etc.", required: false },
      { id: "q2_6", text: "¿En qué etapa se encuentra actualmente tu negocio?", explanation: "(opcional) Indica si tu negocio está en idea, lanzamiento, crecimiento, madurez, etc.", required: false },
    ]
  },
  {
    id: 3,
    title: "FASE 3: Diferenciación",
    questions: [
      { id: "q3_1", text: "¿Cuál es tu producto o servicio estrella?", explanation: "Describe el producto o servicio más importante o más vendido de tu negocio.", required: true },
      { id: "q3_2", text: "¿Qué otros productos o servicios ofreces?", explanation: "(opcional) Enumera otros productos o servicios relevantes que complementan tu oferta principal.", required: false },
      { id: "q3_3", text: "¿Qué hace única tu oferta frente a la competencia?", explanation: "(opcional) Explica los aspectos que te diferencian, como calidad, precio, atención, tecnología, etc.", required: false },
      { id: "q3_4", text: "¿Cuál es el rango de precios de tus productos o servicios?", explanation: "(opcional) Indica precios aproximados, rangos o cómo se calculan.", required: false },
      { id: "q3_5", text: "¿Existen condiciones especiales de venta, entrega o garantía?", explanation: "(opcional) Menciona políticas de devolución, tiempos de entrega, garantías, etc.", required: false },
    ]
  },
  {
    id: 4,
    title: "FASE 4: El Cliente Ideal",
    questions: [
      { id: "q4_1", text: "¿Cuál es el nombre y título/posición de tu cliente ideal (avatar)?", explanation: "Escribe el nombre ficticio y el cargo o rol de tu cliente ideal para personalizarlo.", required: true },
      { id: "q4_2", text: "¿Cuál es su perfil demográfico completo?", explanation: "(opcional) Describe edad, género, nivel educativo, ingresos, ubicación, etc.", required: false },
      { id: "q4_3", text: "¿En qué tipo de empresa trabaja (tamaño, industria, ingresos)?", explanation: "(opcional) Indica el tipo de empresa, sector, tamaño y nivel de ingresos donde trabaja tu avatar.", required: false },
      { id: "q4_4", text: "¿Cuáles son los principales problemas y frustraciones que enfrenta?", explanation: "(opcional) Enumera los retos, obstáculos o frustraciones más relevantes para tu avatar.", required: false },
      { id: "q4_5", text: "¿Cuáles son sus objetivos y metas principales?", explanation: "(opcional) Explica qué busca lograr tu avatar en su vida profesional o personal.", required: false },
      { id: "q4_6", text: "¿Cómo toma decisiones de compra?", explanation: "(opcional) Describe el proceso de decisión, fuentes de información y personas que influyen en la compra.", required: false },
    ]
  },
  {
    id: 5,
    title: "FASE 5: Mercado y Segmentación",
    questions: [
      { id: "q5_1", text: "¿Qué segmentos de clientes has identificado?", explanation: "Enumera los diferentes tipos de clientes o nichos dentro de tu mercado.", required: false },
      { id: "q5_2", text: "¿Cuál es el tamaño de tu mercado y su tasa de crecimiento?", explanation: "(opcional) Indica el número de clientes potenciales y el crecimiento anual estimado.", required: false },
      { id: "q5_3", text: "¿Qué patrones de comportamiento tienen tus clientes?", explanation: "(opcional) Describe hábitos de compra, preferencias o comportamientos comunes de tus clientes.", required: false },
      { id: "q5_4", text: "¿Cuál es tu segmento objetivo prioritario y por qué?", explanation: "(opcional) Explica cuál es el segmento más importante para tu negocio y la razón.", required: false },
      { id: "q5_5", text: "¿Cuáles son las principales tendencias del mercado?", explanation: "(opcional) Menciona cambios, innovaciones o comportamientos relevantes en tu sector.", required: false },
      { id: "q5_6", text: "¿Cómo defines tu mercado objetivo (TAM, SAM, SOM)?", explanation: "(opcional) Describe el tamaño total del mercado, el segmento accesible y el objetivo al que apuntas.", required: false },
    ]
  },
  {
    id: 6,
    title: "FASE 6: Competencia",
    questions: [
      { id: "q6_1", text: "¿Cuáles son tus 3-5 competidores directos principales?", explanation: "Enumera las empresas, marcas o negocios que compiten directamente contigo en tu sector o nicho.", required: true },
      { id: "q6_2", text: "¿Quiénes consideras competidores indirectos o sustitutos?", explanation: "(opcional) Menciona empresas, servicios o productos alternativos que pueden suplir tu oferta aunque no sean competencia directa.", required: false },
      { id: "q6_3", text: "¿Cuáles son las fortalezas y debilidades de tus competidores principales?", explanation: "(opcional) Describe en qué son fuertes y en qué son débiles tus principales competidores (precio, calidad, servicio, etc.).", required: false },
      { id: "q6_4", text: "¿Cómo se comparan los precios y modelos de negocio de tus competidores?", explanation: "(opcional) Explica si tus competidores tienen precios más altos, bajos, diferentes modelos de suscripción, etc.", required: false },
      { id: "q6_5", text: "¿Qué participación de mercado y presencia tienen tus competidores?", explanation: "(opcional) Indica si dominan en tu ciudad, región, país, o si tienen presencia online, tiendas físicas, etc.", required: false },
      { id: "q6_6", text: "¿Qué estrategias de marketing utilizan tus competidores?", explanation: "(opcional) Enumera los canales y tácticas que usan (redes sociales, publicidad, eventos, alianzas, etc.).", required: false },
    ]
  },
  {
    id: 7,
    title: "FASE 7: Misión y Valores",
    questions: [
      { id: "q7_1", text: "¿Cuál es la misión y propósito de tu marca?", explanation: "Describe el objetivo principal y el impacto que tu marca busca generar en el mundo o en tus clientes.", required: true },
      { id: "q7_2", text: "¿Cuáles son los valores fundamentales de tu marca?", explanation: "(opcional) Enumera los principios éticos o creencias que guían todas las acciones y decisiones de tu marca.", required: false },
      { id: "q7_3", text: "¿Cómo describirías la personalidad de tu marca?", explanation: "(opcional) Explica los rasgos humanos o atributos que definen el carácter de tu marca (ej: cercana, innovadora, alegre).", required: false },
      { id: "q7_4", text: "¿Cuál es la voz y tono de comunicación de tu marca?", explanation: "(opcional) Indica cómo se expresa tu marca en sus mensajes (ej: amigable, profesional, inspiradora).", required: false },
      { id: "q7_5", text: "¿Cómo quieres que te perciba tu audiencia?", explanation: "(opcional) Describe la imagen o reputación que deseas construir en la mente de tus clientes.", required: false },
      { id: "q7_6", text: "¿Cuál es tu declaración de posicionamiento de marca?", explanation: "(opcional) Resume en una frase clara por qué tu marca es única y la mejor opción para tu público objetivo.", required: false },
    ]
  },
  {
    id: 8,
    title: "FASE 8: Análisis Estratégico",
    questions: [
      { id: "q8_1", text: "¿Cuáles son las principales fortalezas de tu negocio?", explanation: "Enumera ventajas internas, recursos, capacidades o aspectos positivos que te destacan.", required: true },
      { id: "q8_2", text: "¿Qué oportunidades ves en el mercado?", explanation: "(opcional) Describe tendencias, nichos, cambios o situaciones externas que puedes aprovechar.", required: false },
      { id: "q8_3", text: "¿Cuáles son tus principales debilidades?", explanation: "(opcional) Menciona áreas de mejora, limitaciones o recursos que te faltan.", required: false },
      { id: "q8_4", text: "¿Qué amenazas externas pueden afectar tu negocio?", explanation: "(opcional) Enumera riesgos, competencia, cambios regulatorios, económicos, etc.", required: false },
      { id: "q8_5", text: "¿Qué acciones piensas tomar para aprovechar oportunidades o reducir riesgos?", explanation: "(opcional) Explica estrategias o ideas para mejorar tu posición en el mercado.", required: false },
    ]
  }
];

// --- Components ---

const Header = () => (
  <header className="w-full py-8 px-6 flex flex-col items-center justify-center space-y-4 bg-white/50 backdrop-blur-sm border-b border-gold/20">
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-gold mb-2">Silvia Silva</h1>
      <p className="text-sm md:text-base font-medium tracking-widest text-gray-500 uppercase">Mentora en Marca Personal y Growth Marketer</p>
    </div>
    <div className="h-px w-24 bg-gold/40" />
    <h2 className="text-2xl md:text-3xl font-serif text-gray-800">PLANTILLA FUNDACIÓN</h2>
  </header>
);

const Footer = () => (
  <footer className="w-full py-12 px-6 mt-12 bg-white/80 border-t border-gold/20 text-center space-y-2">
    <p className="text-gold font-serif text-xl">Silvia Silva y Luis Figuerola Presentan</p>
    <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">@2026 FUNDAMENTOS DE TU NEGOCIO</p>
  </footer>
);

export default function App() {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('fundamentos_answers');
    if (saved) {
      setAnswers(JSON.parse(saved));
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('fundamentos_answers', JSON.stringify(answers));
  };

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const startRecording = (id: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(id);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleAnswerChange(id, (answers[id] || '') + ' ' + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(null);
    };

    recognition.onend = () => {
      setIsRecording(null);
    };

    recognition.start();
  };

  const readBack = (text: string, id: string) => {
    if (!text) return;
    
    if (isReading === id) {
      window.speechSynthesis.cancel();
      setIsReading(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.onstart = () => setIsReading(id);
    utterance.onend = () => setIsReading(null);
    window.speechSynthesis.speak(utterance);
  };

  const nextPhase = () => {
    if (currentPhaseIdx < PHASES.length - 1) {
      saveProgress();
      setCurrentPhaseIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      saveProgress();
      setIsComplete(true);
    }
  };

  const prevPhase = () => {
    if (currentPhaseIdx > 0) {
      setCurrentPhaseIdx(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(191, 164, 115); // Gold
    doc.text("FUNDAMENTOS DE TU NEGOCIO", margin, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Silvia Silva y Luis Figuerola", margin, y);
    y += 15;

    PHASES.forEach((phase, pIdx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(191, 164, 115);
      doc.text(phase.title, margin, y);
      y += 10;

      phase.questions.forEach((q) => {
        const answer = answers[q.id] || "Sin respuesta";
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        const splitQuestion = doc.splitTextToSize(q.text, 170);
        
        if (y + splitQuestion.length * 6 > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(splitQuestion, margin, y);
        y += splitQuestion.length * 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const splitAnswer = doc.splitTextToSize(answer, 170);
        
        if (y + splitAnswer.length * 5 > 280) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(splitAnswer, margin, y);
        y += splitAnswer.length * 5 + 8;
      });
      
      y += 5;
    });

    // Add footer to the last page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Silvia Silva y Luis Figuerola Presentan - @2026 FUNDAMENTOS DE TU NEGOCIO", 105, y, { align: "center" });

    doc.save("Fundamentos_Negocio_SilviaSilva.pdf");
  };

  const currentPhase = PHASES[currentPhaseIdx];

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-elegant">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8 border border-gold/10"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-gold" />
            </div>
          </div>
          <h2 className="text-4xl font-serif text-gray-800">¡Cuestionario Completado!</h2>
          <p className="text-gray-600 text-lg">
            Has definido los cimientos de tu negocio. Ahora puedes descargar tu documento PDF con todas tus respuestas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={generatePDF}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-red text-white rounded-full font-bold text-lg shadow-lg hover:bg-brand-red/90 transition-all hover:scale-105 active:scale-95"
            >
              <FileDown className="w-6 h-6" />
              Descargar PDF
            </button>
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentPhaseIdx(0);
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gold border-2 border-gold rounded-full font-bold text-lg hover:bg-gold/5 transition-all"
            >
              Revisar Respuestas
            </button>
          </div>
        </motion.div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-elegant selection:bg-gold/20">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-12 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-gold font-bold text-sm tracking-widest uppercase">Fase {currentPhase.id} de {PHASES.length}</p>
              <h3 className="text-3xl font-serif text-gray-800">{currentPhase.title}</h3>
            </div>
            <p className="text-gray-400 font-medium">{Math.round(((currentPhaseIdx + 1) / PHASES.length) * 100)}%</p>
          </div>
          <div className="h-2 w-full bg-gold/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${((currentPhaseIdx + 1) / PHASES.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Phase Tabs Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
          {PHASES.map((phase, idx) => (
            <button
              key={phase.id}
              onClick={() => {
                saveProgress();
                setCurrentPhaseIdx(idx);
              }}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                currentPhaseIdx === idx 
                  ? "bg-gold text-white border-gold shadow-md" 
                  : "bg-white text-gray-400 border-gray-200 hover:border-gold/30"
              )}
            >
              FASE {phase.id}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {currentPhase.questions.map((q) => (
                <div key={q.id} className="group space-y-4">
                  <div className="space-y-2">
                    <label className="text-xl font-serif text-gray-800 flex items-start gap-2">
                      {q.text}
                      {q.required && <span className="text-brand-red text-sm">*</span>}
                    </label>
                    {q.explanation && (
                      <p className="text-sm text-gray-500 italic leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full min-h-[150px] p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm focus:border-gold/50 focus:ring-0 transition-all text-lg resize-none placeholder:text-gray-300"
                    />
                    
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => readBack(answers[q.id], q.id)}
                        title="Leer respuesta"
                        className={cn(
                          "p-3 rounded-full transition-all shadow-sm",
                          isReading === q.id ? "bg-gold text-white" : "bg-gray-50 text-gray-400 hover:text-gold hover:bg-gold/10"
                        )}
                      >
                        {isReading === q.id ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => startRecording(q.id)}
                        title="Responder con audio"
                        className={cn(
                          "p-3 rounded-full transition-all shadow-sm",
                          isRecording === q.id ? "bg-brand-red text-white animate-pulse" : "bg-gray-50 text-gray-400 hover:text-brand-red hover:bg-brand-red/10"
                        )}
                      >
                        {isRecording === q.id ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleAnswerChange(q.id, '')}
                        title="Borrar"
                        className="p-3 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-gold/10">
            <button
              onClick={prevPhase}
              disabled={currentPhaseIdx === 0}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all",
                currentPhaseIdx === 0 
                  ? "opacity-0 pointer-events-none" 
                  : "text-gray-400 hover:text-gold hover:bg-gold/5"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
              Anterior
            </button>

            <div className="flex gap-4">
              <button
                onClick={saveProgress}
                className="flex items-center gap-2 px-6 py-4 bg-white text-gold border-2 border-gold rounded-full font-bold hover:bg-gold/5 transition-all shadow-sm"
              >
                <Save className="w-5 h-5" />
                Guardar
              </button>
              <button
                onClick={nextPhase}
                className="flex items-center gap-2 px-10 py-4 bg-brand-red text-white rounded-full font-bold text-lg shadow-lg hover:bg-brand-red/90 transition-all hover:scale-105 active:scale-95"
              >
                {currentPhaseIdx === PHASES.length - 1 ? "Finalizar" : "Siguiente"}
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-brand-red text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            <span className="font-bold tracking-wide">Escuchando...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
