

import { v4 as uuidv4 } from 'uuid';
import type { Novel, Chapter } from './types.ts';

export const FONT_FACES = [
  "EB Garamond",
  "Merriweather",
  "Lora",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Verdana",
  "Courier New",
];

export const FONT_SIZES = [
  { name: "12px", value: "2" },
  { name: "14px", value: "3" },
  { name: "16px", value: "4" },
  { name: "18px", value: "5" },
  { name: "24px", value: "6" },
  { name: "32px", value: "7" }
];

export const AI_STYLES = [
  "Standard",
  "Formel",
  "Familier",
  "Poétique",
  "Vieux Français",
  "Humoristique",
  "Sombre et Intense",
] as const;

export const BOOK_FORMATS = {
  poche: { name: 'Poche (110x180mm)', width: 110, height: 180 },
  roman: { name: 'Roman A5 (148x210mm)', width: 148, height: 210 },
  trade: { name: 'Trade Paperback (6x9")', width: 152.4, height: 228.6 },
} as const;

export const createNewChapter = (title: string, content: string): Chapter => ({
    id: uuidv4(),
    title,
    content,
    notes: '',
    snapshots: [],
});

const createInitialChapter = (): Chapter => createNewChapter(
    "Chapitre 1",
    `<div>
        <p>
          <font face="EB Garamond" size="5">
            <b>Commencez votre chef-d'œuvre ici...</b>
          </font>
        </p>
        <p>
          <font face="EB Garamond" size="4">
            Utilisez la barre d'outils ci-dessus pour formater votre texte. Sélectionnez une partie de votre écriture et cliquez sur 
            <i>"Améliorer"</i> pour laisser l'IA la réécrire avec plus d'impact, ou cliquez sur <i>"Continuer"</i> 
            pour que l'IA poursuive votre histoire.
          </font>
        </p>
        <p><br></p>
      </div>`
);

export const createNewNovel = (title: string): Novel => ({
    id: uuidv4(),
    title,
    chapters: [createInitialChapter()], 
    characters: [],
    places: [],
    images: [],
    timeline: [],
    relationships: [],
    plan: [
        { id: uuidv4(), title: 'Acte I : Exposition', content: 'Présentez les personnages principaux, le monde et le conflit initial.' },
        { id: uuidv4(), title: 'Acte II : Confrontation', content: 'Le protagoniste fait face à des obstacles croissants. La tension monte.' },
        { id: uuidv4(), title: 'Acte III : Résolution', content: 'Le point culminant de l\'histoire, suivi de la résolution du conflit et des conséquences.' },
    ],
    publicationData: {
      authorName: '',
      acknowledgements: '',
      genre: '',
      era: '',
      hasAdultContent: false,
      adultContentDisclaimer: '',
      isbn: '',
      editorName: '',
      editorAddress: '',
      printerName: '',
      printerAddress: '',
      legalDepositDate: '',
      legalNotice: '',
    }
});

export const DEFAULT_POMODORO_DURATIONS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export const POMODORO_CYCLES = 4; // Long break after 4 work cycles

export const DEFAULT_WRITING_GOAL = 500;
export const WORDS_PER_PAGE = 250;
export const WORDS_PER_MINUTE_READING = 200;

export const FOCUS_MODE_CLASSES = {
    hideUI: 'focus-hide-ui',
    centerText: 'focus-center-text',
} as const;

export const ADULT_CONTENT_DISCLAIMER = "AVERTISSEMENT\n\nCe roman est destiné à un public adulte et averti. Il contient des scènes explicites, de la violence, ou un langage qui peut ne pas convenir aux lecteurs de moins de 18 ans. La lecture est recommandée à un public averti.";

export const AUTOSAVE_INTERVAL = 300000; // 5 minutes en millisecondes