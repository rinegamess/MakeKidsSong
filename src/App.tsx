import React, { useState, useEffect, useRef } from "react";
import {
  Music,
  Video,
  FileText,
  Play,
  RotateCw,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ListRestart,
  Compass,
  ArrowRight,
  Volume2,
  Sun,
  Moon,
  Monitor,
  Globe
} from "lucide-react";
import { Project, StoryboardScene } from "./types";

// Translation dictionary for Turkish and English views
const translations = {
  tr: {
    title: "KidsFarmAI",
    subtitle: "Otonom Çocuk Şarkısı ve Video Yardımcı Pilotu",
    architect: "MİMARİ MOTOR",
    songForge: "Şarkı Havuzu AI",
    localTime: "TR Saati",
    configurePrompt: "Şarkı İstemi Yapılandır",
    topicLabel: "Şarkı Fikri / Konusu",
    topicPlaceholder: "Örn. Sabah diş fırçalama, sevimli çiftlik hayvanları, paylaşmak güzeldir...",
    ageGroupLabel: "Yaş Grubu",
    langLabel: "Şarkı Dili",
    songStyleLabel: "Şarkı Tarzı",
    voiceStyleLabel: "Seslendirme Tarzı",
    videoStyleLabel: "Video Görsel Tarzı",
    btnSubmitting: "Proje İşleniyor...",
    btnForge: "Şarkı ve Video Üret",
    libTitle: "Şarkı Kütüphanesi",
    emptyLib: "Kütüphaneniz henüz boş. İlk üretiminizi başlatmak için yukarıya bir şarkı fikri yazın!",
    statusGenerating: "Üretiliyor",
    statusReady: "Hazır",
    statusFailed: "Başarısız",
    buildId: "Yapı Kimliği",
    downloadVideo: "Videoyu İndir",
    activePipeline: "Yapay Zeka Üretim Akışı Aktif...",
    pipelineDesc: "Lütfen bekleyin. Modellerimiz şarkı sözü oluşturuyor, vokalleri senkronize ediyor, 1080p Pixar tarzı sahneler çiziyor ve her şeyi FFmpeg ile birleştiriyor.",
    interrupted: "Video Üretimi Kesildi",
    halted: "İşlem durduruldu.",
    progressLabel: "Aşama İlerlemesi",
    serverCalcs: "Sunucuda adım hesaplamaları yürütülüyor...",
    duration: "Süre",
    elapsed: "Geçen Süre",
    scenes: "Sahneler",
    estCost: "Tahm. Maliyet",
    tabStoryboard: "Görsel Akış Planı",
    tabLogs: "Scrolling Terminal Günlükleri",
    awaitingDraw: "6. Aşama Bekleniyor",
    karaokeOverlay: "Karaoke Altyazı",
    camera: "Kamera",
    regenScene: "Sahneyi Yeniden Üret",
    noStoryboard: "Henüz planlama oluşturulmadı",
    noStoryboardDesc: "Üretim akışının 2. aşamasının tamamlanmasını bekleyin.",
    terminalTitle: "PROJE MOTORU OTURUM TERMİNALİ",
    online: "ÇEVRİMİÇİ",
    pipelineRoadmap: "Üretim Akış Sırası",
    noProject: "Aktif proje seçilmedi",
    noProjectDesc: "Sol paneldeki detayları ayarlayın ve anında 1080p harika çocuk videoları üretmek için 'Şarkı ve Video Üret' butonuna tıklayın.",
    
    // Select options mapping
    toddler: "Bebek (1-2 Yaş)",
    preschool: "Okul Öncesi (3-5 Yaş)",
    elementary: "İlkokul (6-8 Yaş)",
    
    eng: "İngilizce",
    spa: "İspanyolca",
    fre: "Fransızca",
    tur: "Türkçe",
    
    happyUpbeat: "Mutlu & Canlı Kreş Şarkısı",
    calmingBedtime: "Sakinleştirici Uyku Ninnisi",
    playfulDance: "Eğlenceli Dans / Disko",
    educationalGuitar: "Eğitici Akustik Gitar",
    
    lily: "Lily (Neşeli Çocuk)",
    puck: "Puck (Oyuncu Elf)",
    rachel: "Rachel (Şefkatli Anne Sesi)",
    ethan: "Ethan (Yumuşak Anlatıcı)",
    
    pixar: "Pixar 3D Çizgi Film",
    watercolor: "Masalsı Suluboya Resim",
    flatVector: "Düz Vektör İllüstrasyonu",
    claymation: "Sevimli Oyun Hamuru Animasyonu",

    // Step labels
    stepLyrics: "Sözler",
    stepStoryboard: "Plan",
    stepMusic: "Müzik",
    stepVocals: "Vokaller",
    stepMix: "Mikst",
    stepDraw: "Çizim",
    stepAnimate: "Animasyon",
    stepSubtitles: "Altyazı",
    stepRender: "Derleme",
    stepFinal: "Sonuç"
  },
  en: {
    title: "KidsFarmAI",
    subtitle: "Autonomous Children's Video & Song Co-Pilot",
    architect: "ARCHITECT ENGINE",
    songForge: "Song Forge AI",
    localTime: "TR Time",
    configurePrompt: "Configure Song Prompt",
    topicLabel: "Song Idea / Topic",
    topicPlaceholder: "e.g. Brushing teeth in the morning, cute animals, sharing is caring...",
    ageGroupLabel: "Age Group",
    langLabel: "Song Language",
    songStyleLabel: "Song Style",
    voiceStyleLabel: "Voice Style",
    videoStyleLabel: "Video Visual Style",
    btnSubmitting: "Forging Project...",
    btnForge: "Forge Song & Video",
    libTitle: "Song Library",
    emptyLib: "Your library is empty. Type a song idea above to generate your first production!",
    statusGenerating: "Generating",
    statusReady: "Ready",
    statusFailed: "Failed",
    buildId: "Build ID",
    downloadVideo: "Download Output.mp4",
    activePipeline: "Autonomous AI Pipeline Active...",
    pipelineDesc: "Please wait. Our models are generating lyrics, timing vocals, creating 1080p Pixar frames, and compiling everything inside our FFmpeg engine.",
    interrupted: "Video Generation Interrupted",
    halted: "Execution halted.",
    progressLabel: "Step Progress",
    serverCalcs: "Executing step calculations on Linux Server...",
    duration: "Duration",
    elapsed: "Elapsed",
    scenes: "Scenes",
    estCost: "Est. Cost",
    tabStoryboard: "Storyboard Visualizer",
    tabLogs: "Scrolling Terminal Logs",
    awaitingDraw: "Awaiting Step 6",
    karaokeOverlay: "Karaoke Overlay",
    camera: "Camera",
    regenScene: "Regen Scene",
    noStoryboard: "No Storyboard generated yet",
    noStoryboardDesc: "Wait for Step 2 of the queue to complete.",
    terminalTitle: "PROJECT ENGINE SESSION TERMINAL",
    online: "ONLINE",
    pipelineRoadmap: "Pipeline Sequence",
    noProject: "No active project",
    noProjectDesc: "Configure details in the left panel and click 'Forge Song & Video' to start generating beautiful Children's MP4 nursery videos instantly.",
    
    // Select options mapping
    toddler: "Toddler (1-2)",
    preschool: "Preschool (3-5)",
    elementary: "Early Elementary (6-8)",
    
    eng: "English",
    spa: "Spanish",
    fre: "French",
    tur: "Turkish",
    
    happyUpbeat: "Happy & Upbeat Nursery",
    calmingBedtime: "Calming Bedtime Lullaby",
    playfulDance: "Playful Dance / Disco",
    educationalGuitar: "Educational Acoustic Guitar",
    
    lily: "Lily (Cheerful Child)",
    puck: "Puck (Playful Elf)",
    rachel: "Rachel (Warm Motherly Voice)",
    ethan: "Ethan (Kind Narrator)",
    
    pixar: "Pixar 3D Cartoon",
    watercolor: "Whimsical Pastel Watercolor",
    flatVector: "Flat Illustration vector",
    claymation: "Cute Claymation / Stopmotion",

    // Step labels
    stepLyrics: "Lyrics",
    stepStoryboard: "Storyboard",
    stepMusic: "Music",
    stepVocals: "Vocals",
    stepMix: "Mix",
    stepDraw: "Draw",
    stepAnimate: "Animate",
    stepSubtitles: "Subtitles",
    stepRender: "Render",
    stepFinal: "Final"
  }
};

export default function App() {
  // Page language view state (standard set to 'tr')
  const [uiLang, setUiLang] = useState<'tr' | 'en'>('tr');

  // Theme settings state (light, dark, system - standard is system)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("Initializing Creative Studio...");

  // Turkey Local Time state (Europe/Istanbul)
  const [currentTime, setCurrentTime] = useState("");

  // Form input state - synchronizing standard to Turkish values
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("Preschool (3-5)");
  const [language, setLanguage] = useState("Turkish"); // defaults to Turkish
  const [songStyle, setSongStyle] = useState("Happy & Upbeat Nursery");
  const [videoStyle, setVideoStyle] = useState("Pixar 3D Cartoon");
  const [voiceStyle, setVoiceStyle] = useState("Lily (Cheerful Child)");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'storyboard' | 'logs'>('storyboard');

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize page settings and listeners
  useEffect(() => {
    const savedLang = localStorage.getItem("kidsfarm_lang") as 'tr' | 'en' || 'tr';
    setUiLang(savedLang);
    setLanguage(savedLang === 'tr' ? 'Turkish' : 'English');

    const savedTheme = localStorage.getItem("kidsfarm_theme") as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  // Update theme settings dynamically
  useEffect(() => {
    localStorage.setItem("kidsfarm_theme", theme);
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(media.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Live turkey time clock (Europe/Istanbul timezone)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("tr-TR", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set page language changes and sync default select language
  const handleUiLangChange = (lang: 'tr' | 'en') => {
    setUiLang(lang);
    localStorage.setItem("kidsfarm_lang", lang);
    setLanguage(lang === 'tr' ? 'Turkish' : 'English');
  };

  // Fetch all projects at startup
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);

        // Auto-select first project if none selected yet
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 2500);
    return () => clearInterval(interval);
  }, [selectedProjectId]);

  // Fetch log stream for selected project
  const fetchLogs = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/project/${selectedProjectId}/logs`);
      if (res.ok) {
        const text = await res.text();
        setLogs(text);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [selectedProjectId]);

  // Scroll logs to bottom automatically
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          ageGroup,
          language,
          songStyle,
          videoStyle,
          voiceStyle,
        }),
      });

      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);
        setSelectedProjectId(newProject.id);
        setTopic("");
        setActiveTab("storyboard");
      }
    } catch (err) {
      console.error("Error starting generation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryStep = async (stepNumber: number) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/project/${selectedProjectId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNumber }),
      });
      if (res.ok) {
        fetchProjects();
        setActiveTab("logs");
      }
    } catch (err) {
      console.error("Error retrying step:", err);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // List of 10 incremental pipeline steps
  const pipelineSteps = [
    { num: 1, key: "stepLyrics" },
    { num: 2, key: "stepStoryboard" },
    { num: 3, key: "stepMusic" },
    { num: 4, key: "stepVocals" },
    { num: 5, key: "stepMix" },
    { num: 6, key: "stepDraw" },
    { num: 7, key: "stepAnimate" },
    { num: 8, key: "stepSubtitles" },
    { num: 9, key: "stepRender" },
    { num: 10, key: "stepFinal" },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 ${
      resolvedTheme === 'dark' ? 'bg-[#050507] text-[#e0e0e0]' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Whimsical & Premium KidsFarmAI Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 ${
        resolvedTheme === 'dark' ? 'bg-[#0c0c0e]/85 border-white/10' : 'bg-white/85 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-black p-2 rounded-xl shadow-lg shadow-amber-500/15">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-[0.3em] text-amber-500 uppercase mb-0.5">
              {translations[uiLang].architect}
            </h1>
            <h2 className={`text-xl font-light leading-tight transition-colors duration-300 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {translations[uiLang].title}
            </h2>
          </div>
        </div>

        {/* Global Toolbar Options (Language selection and Theme control) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Turkey Local Time */}
          <div className={`flex items-center gap-2 border rounded-xl p-2 text-xs font-mono transition-colors duration-300 ${
            resolvedTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{translations[uiLang].localTime}: {currentTime || "..."}</span>
          </div>

          {/* Language Toggle (TR as Default Page) */}
          <div className={`flex items-center rounded-xl p-1 border transition-colors duration-300 ${
            resolvedTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => handleUiLangChange('tr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                uiLang === 'tr'
                  ? 'bg-amber-500 text-black shadow-md'
                  : resolvedTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TR
            </button>
            <button
              onClick={() => handleUiLangChange('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                uiLang === 'en'
                  ? 'bg-amber-500 text-black shadow-md'
                  : resolvedTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* Theme Selector (Light, Dark, System) */}
          <div className={`flex items-center rounded-xl p-1 border transition-colors duration-300 ${
            resolvedTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setTheme('light')}
              title={uiLang === 'tr' ? "Açık Tema" : "Light Theme"}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-500 text-black shadow-md'
                  : resolvedTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title={uiLang === 'tr' ? "Koyu Tema" : "Dark Theme"}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-500 text-black shadow-md'
                  : resolvedTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              title={uiLang === 'tr' ? "Sistem Teması" : "System Theme"}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-amber-500 text-black shadow-md'
                  : resolvedTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="max-w-[1600px] w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column - Form & Quick-Library (5 Columns) */}
        <aside className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Creator Configuration Card */}
          <div className={`rounded-2xl border shadow-2xl p-6 transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'bg-[#0c0c0e] border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-4 h-4 text-amber-500" />
              <h2 className={`text-sm uppercase tracking-widest font-bold ${
                resolvedTheme === 'dark' ? 'text-white/80' : 'text-slate-800'
              }`}>
                {translations[uiLang].configurePrompt}
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                  resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                }`}>
                  {translations[uiLang].topicLabel}
                </label>
                <input
                  type="text"
                  placeholder={translations[uiLang].topicPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`w-full border rounded-md px-3 py-3 text-sm transition-all duration-300 outline-none ${
                    resolvedTheme === 'dark' 
                      ? 'bg-white/5 border-white/10 text-white focus:border-amber-500/50 placeholder:text-white/30' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500 placeholder:text-slate-400'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                    resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                  }`}>
                    {translations[uiLang].ageGroupLabel}
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className={`w-full border rounded-md px-3 py-2.5 text-xs transition-all duration-300 outline-none ${
                      resolvedTheme === 'dark' 
                        ? 'bg-[#0c0c0e] border-white/10 text-white focus:border-amber-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                    }`}
                  >
                    <option value="Toddler (1-2)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].toddler}</option>
                    <option value="Preschool (3-5)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].preschool}</option>
                    <option value="Early Elementary (6-8)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].elementary}</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                    resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                  }`}>
                    {translations[uiLang].langLabel}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full border rounded-md px-3 py-2.5 text-xs transition-all duration-300 outline-none ${
                      resolvedTheme === 'dark' 
                        ? 'bg-[#0c0c0e] border-white/10 text-white focus:border-amber-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                    }`}
                  >
                    <option value="Turkish" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].tur}</option>
                    <option value="English" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].eng}</option>
                    <option value="Spanish" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].spa}</option>
                    <option value="French" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].fre}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                    resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                  }`}>
                    {translations[uiLang].songStyleLabel}
                  </label>
                  <select
                    value={songStyle}
                    onChange={(e) => setSongStyle(e.target.value)}
                    className={`w-full border rounded-md px-3 py-2.5 text-xs transition-all duration-300 outline-none ${
                      resolvedTheme === 'dark' 
                        ? 'bg-[#0c0c0e] border-white/10 text-white focus:border-amber-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                    }`}
                  >
                    <option value="Happy & Upbeat Nursery" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].happyUpbeat}</option>
                    <option value="Calming Bedtime Lullaby" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].calmingBedtime}</option>
                    <option value="Playful Dance / Disco" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].playfulDance}</option>
                    <option value="Educational Acoustic Guitar" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].educationalGuitar}</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                    resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                  }`}>
                    {translations[uiLang].voiceStyleLabel}
                  </label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className={`w-full border rounded-md px-3 py-2.5 text-xs transition-all duration-300 outline-none ${
                      resolvedTheme === 'dark' 
                        ? 'bg-[#0c0c0e] border-white/10 text-white focus:border-amber-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                    }`}
                  >
                    <option value="Lily (Cheerful Child)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].lily}</option>
                    <option value="Puck (Playful Elf)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].puck}</option>
                    <option value="Rachel (Warm Motherly Voice)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].rachel}</option>
                    <option value="Ethan (Kind Narrator)" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].ethan}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                  resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                }`}>
                  {translations[uiLang].videoStyleLabel}
                </label>
                <select
                  value={videoStyle}
                  onChange={(e) => setVideoStyle(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2.5 text-xs transition-all duration-300 outline-none mb-2 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-[#0c0c0e] border-white/10 text-white focus:border-amber-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                  }`}
                >
                  <option value="Pixar 3D Cartoon" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].pixar}</option>
                  <option value="Whimsical Pastel Watercolor" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].watercolor}</option>
                  <option value="Flat Illustration vector" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].flatVector}</option>
                  <option value="Cute Claymation / Stopmotion" className={resolvedTheme === 'dark' ? 'bg-[#0c0c0e]' : 'bg-white'}>{translations[uiLang].claymation}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 uppercase tracking-widest text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    {translations[uiLang].btnSubmitting}
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    {translations[uiLang].btnForge}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick-Access Library */}
          <div className={`rounded-2xl border shadow-2xl p-6 flex-1 flex flex-col min-h-[300px] transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'bg-[#0c0c0e] border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <h3 className={`text-[10px] uppercase tracking-widest font-semibold mb-4 flex items-center gap-2 ${
              resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
            }`}>
              <Layers className="w-4 h-4 text-amber-500" />
              {translations[uiLang].libTitle} ({projects.length})
            </h3>

            {projects.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                resolvedTheme === 'dark' ? 'border-white/10' : 'border-slate-200'
              }`}>
                <Music className={`w-10 h-10 mb-2 ${resolvedTheme === 'dark' ? 'text-white/20' : 'text-slate-300'}`} />
                <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                  {translations[uiLang].emptyLib}
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
                {projects.map((proj) => {
                  const isSelected = proj.id === selectedProjectId;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between gap-4 cursor-pointer ${
                        isSelected
                          ? resolvedTheme === 'dark'
                            ? "bg-white/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                            : "bg-amber-50/50 border-amber-300 text-slate-950 shadow-sm"
                          : resolvedTheme === 'dark'
                            ? "bg-white/5 hover:bg-white/10 border-white/5 text-white/80"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`font-bold text-sm truncate ${
                          isSelected ? 'text-amber-500' : resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'
                        }`}>
                          {proj.name}
                        </div>
                        <div className={`text-xs flex items-center gap-2 mt-1 font-mono ${
                          resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                        }`}>
                          <span>{proj.language === "Turkish" ? translations[uiLang].tur : proj.language}</span>
                          <span>•</span>
                          <span>{proj.songStyle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {proj.status === "generating" && (
                          <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                            {translations[uiLang].statusGenerating}
                          </div>
                        )}
                        {proj.status === "completed" && (
                          <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {translations[uiLang].statusReady}
                          </div>
                        )}
                        {proj.status === "failed" && (
                          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {translations[uiLang].statusFailed}
                          </div>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-500" : resolvedTheme === 'dark' ? "text-white/40" : "text-slate-400"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </aside>

        {/* Right Column - Project Theater & Process Monitoring (7 Columns) */}
        <main className="lg:col-span-7 flex flex-col gap-8">
          {selectedProject ? (
            <>
              {/* Media Theater Header */}
              <div className={`rounded-2xl border shadow-2xl p-6 transition-all duration-300 ${
                resolvedTheme === 'dark' ? 'bg-[#0c0c0e] border-white/10' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-500 tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                      {translations[uiLang].buildId}: {selectedProject.id}
                    </span>
                    <h2 className={`text-xl font-light mt-3 transition-colors duration-300 ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>
                      {selectedProject.name}
                    </h2>
                  </div>

                  {selectedProject.hasVideo && (
                    <a
                      href={`/api/video/${selectedProject.id}`}
                      download={`KidsFarm_${selectedProject.id}.mp4`}
                      className={`font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 shadow-sm ${
                        resolvedTheme === 'dark' 
                          ? 'bg-white/10 hover:bg-white/20 border border-white/10 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      {translations[uiLang].downloadVideo}
                    </a>
                  )}
                </div>

                {/* Theater Screen Frame */}
                <div className={`relative aspect-video rounded-2xl border overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] flex items-center justify-center mb-6 transition-colors duration-300 ${
                  resolvedTheme === 'dark' ? 'bg-black border-white/5' : 'bg-slate-100 border-slate-200'
                }`}>
                  {selectedProject.hasVideo ? (
                    <video
                      src={`/api/video/${selectedProject.id}`}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : selectedProject.status === "generating" ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-amber-400/20 rounded-full animate-ping"></div>
                        <RotateCw className="w-10 h-10 text-amber-400 animate-spin" />
                      </div>
                      <p className="text-xs text-amber-400 tracking-widest uppercase">
                        {translations[uiLang].activePipeline}
                      </p>
                      <p className={`text-[10px] mt-1.5 max-w-sm leading-relaxed ${
                        resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                      }`}>
                        {translations[uiLang].pipelineDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-3" />
                      <p className={`font-bold ${resolvedTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {translations[uiLang].interrupted}
                      </p>
                      <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {selectedProject.error || translations[uiLang].halted}
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Progress Bar */}
                <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                  resolvedTheme === 'dark' ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50 border-amber-500/20 shadow-sm'
                }`}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-amber-500">
                      {selectedProject.currentStep}
                    </span>
                    <span className={`font-mono ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedProject.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                  {selectedProject.status === "generating" && (
                    <p className={`text-[10px] mt-2 italic ${resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                      {translations[uiLang].serverCalcs}
                    </p>
                  )}
                </div>

                {/* Meta stats */}
                <div className={`grid grid-cols-4 gap-4 mt-6 pt-6 border-t text-center transition-colors duration-300 ${
                  resolvedTheme === 'dark' ? 'border-white/5' : 'border-slate-100'
                }`}>
                  <div>
                    <div className={`text-[10px] uppercase font-semibold ${resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      {translations[uiLang].duration}
                    </div>
                    <div className={`text-sm font-mono mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedProject.duration}s
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase font-semibold ${resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      {translations[uiLang].elapsed}
                    </div>
                    <div className={`text-sm font-mono mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedProject.elapsedTime}s
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase font-semibold ${resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      {translations[uiLang].scenes}
                    </div>
                    <div className={`text-sm font-mono mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedProject.sceneCount}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase font-semibold ${resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      {translations[uiLang].estCost}
                    </div>
                    <div className="text-sm font-mono text-amber-500 mt-1">
                      ${selectedProject.apiCost.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Storyboard vs Active Logs */}
              <div className={`flex flex-col flex-1 rounded-2xl border shadow-2xl overflow-hidden min-h-[450px] transition-all duration-300 ${
                resolvedTheme === 'dark' ? 'bg-[#0c0c0e] border-white/10' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className={`flex border-b transition-colors duration-300 ${
                  resolvedTheme === 'dark' ? 'bg-[#050507] border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setActiveTab("storyboard")}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activeTab === "storyboard"
                        ? resolvedTheme === 'dark'
                          ? "bg-[#0c0c0e] text-white border-t-2 border-amber-500"
                          : "bg-white text-slate-800 border-t-2 border-amber-500 shadow-sm"
                        : resolvedTheme === 'dark'
                          ? "text-white/40 hover:text-white"
                          : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    {translations[uiLang].tabStoryboard}
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activeTab === "logs"
                        ? resolvedTheme === 'dark'
                          ? "bg-[#0c0c0e] text-white border-t-2 border-amber-500"
                          : "bg-white text-slate-800 border-t-2 border-amber-500 shadow-sm"
                        : resolvedTheme === 'dark'
                          ? "text-white/40 hover:text-white"
                          : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    {translations[uiLang].tabLogs}
                  </button>
                </div>

                {/* Tab content area */}
                <div className="p-6 flex-1 flex flex-col min-h-0">
                  {activeTab === "storyboard" ? (
                    <div className="flex-1 overflow-y-auto space-y-6 max-h-[500px]">
                      {selectedProject.storyboard && selectedProject.storyboard.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedProject.storyboard.map((scene) => (
                            <div
                              key={scene.id}
                              className={`rounded-2xl border overflow-hidden flex flex-col group transition-all duration-300 ${
                                resolvedTheme === 'dark' 
                                  ? 'bg-white/5 border-white/5 hover:border-amber-500/30' 
                                  : 'bg-slate-50 border-slate-200 hover:border-amber-500/30 shadow-sm'
                              }`}
                            >
                              {/* Illustration slot */}
                              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                {scene.imageUrl ? (
                                  <img
                                    src={scene.imageUrl}
                                    alt={`Scene ${scene.id}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-white/30 text-center p-4">
                                    <Clock className="w-8 h-8 text-white/25 mb-1 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase">
                                      {translations[uiLang].awaitingDraw}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute top-2.5 left-2.5 bg-black/85 border border-white/10 text-white font-mono text-[10px] px-2.5 py-1 rounded-md">
                                  Scene {scene.id} ({scene.timeStart}s - {scene.timeEnd}s)
                                </div>
                              </div>

                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className={`text-xs font-semibold italic ${
                                    resolvedTheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                                  }`}>
                                    "{scene.visual}"
                                  </div>
                                  <div className={`border rounded-lg p-2.5 text-xs flex items-start gap-1.5 transition-colors duration-300 ${
                                    resolvedTheme === 'dark' 
                                      ? 'bg-amber-500/5 border-amber-500/10 text-amber-400' 
                                      : 'bg-amber-50 border-amber-200/50 text-amber-800'
                                  }`}>
                                    <Volume2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{translations[uiLang].karaokeOverlay}: {scene.subtitle}</span>
                                  </div>
                                </div>

                                {/* Step Recovery / Retry Action */}
                                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] transition-colors duration-300 ${
                                  resolvedTheme === 'dark' ? 'border-white/5' : 'border-slate-200'
                                }`}>
                                  <span className={`font-mono ${resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                                    {translations[uiLang].camera}: {scene.cameraMovement}
                                  </span>
                                  <button
                                    onClick={() => handleRetryStep(6)}
                                    title="Regenerate this specific scene step illustration"
                                    className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <ListRestart className="w-3.5 h-3.5" />
                                    {translations[uiLang].regenScene}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-12 ${resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                          <Layers className={`w-12 h-12 mx-auto mb-3 ${resolvedTheme === 'dark' ? 'text-white/10' : 'text-slate-200'}`} />
                          <p className="font-bold">{translations[uiLang].noStoryboard}</p>
                          <p className="text-xs">{translations[uiLang].noStoryboardDesc}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Scrolling terminal logs
                    <div className={`flex-1 flex flex-col min-h-0 border overflow-hidden font-mono text-[11px] transition-colors duration-300 ${
                      resolvedTheme === 'dark' ? 'bg-black/60 border-white/5' : 'bg-slate-900 border-slate-200'
                    }`}>
                      <div className={`border-b px-4 py-2 text-[10px] flex items-center justify-between transition-colors duration-300 ${
                        resolvedTheme === 'dark' ? 'bg-[#050507] border-white/10 text-white/40' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        <span>{translations[uiLang].terminalTitle}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>{translations[uiLang].online}</span>
                        </div>
                      </div>
                      <div className={`flex-1 p-4 overflow-y-auto space-y-1.5 max-h-[350px] font-mono text-xs ${
                        resolvedTheme === 'dark' ? 'text-green-400/80' : 'text-green-400'
                      }`}>
                        {logs.split("\n").map((line, idx) => {
                          if (!line.trim()) return null;
                          return (
                            <div key={idx} className={`leading-relaxed px-1 rounded transition-colors ${
                              resolvedTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-800'
                            }`}>
                              {line}
                            </div>
                          );
                        })}
                        <div ref={logEndRef} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pipeline Roadmap Steps */}
                <div className={`border-t p-6 transition-colors duration-300 ${
                  resolvedTheme === 'dark' ? 'bg-[#050507] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`text-[10px] uppercase tracking-widest mb-3.5 ${
                    resolvedTheme === 'dark' ? 'text-white/30' : 'text-slate-400'
                  }`}>
                    {translations[uiLang].pipelineRoadmap}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-center">
                    {pipelineSteps.map((step) => {
                      // Determine status relative to progress
                      let status = "pending";
                      if (selectedProject.status === "completed") {
                        status = "done";
                      } else if (selectedProject.status === "failed") {
                        status = "error";
                      } else {
                        const currentStepIndex = Math.ceil(selectedProject.progress / 10);
                        if (step.num < currentStepIndex) {
                          status = "done";
                        } else if (step.num === currentStepIndex) {
                          status = "active";
                        }
                      }

                      // Dynamic step name translation
                      const localizedStepLabel = translations[uiLang][step.key as keyof typeof translations['tr']] || step.key;

                      return (
                        <div
                          key={step.num}
                          title={localizedStepLabel}
                          className={`rounded-xl p-2.5 border transition-all text-center flex flex-col items-center justify-center ${
                            status === "done"
                              ? "bg-green-500/10 border-green-500/20 text-green-400 font-medium"
                              : status === "active"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse font-semibold"
                              : resolvedTheme === 'dark'
                                ? "bg-white/5 border-white/5 text-white/30"
                                : "bg-slate-100 border-slate-200 text-slate-400"
                          }`}
                        >
                          <div className="text-[10px] font-extrabold uppercase">Step {step.num}</div>
                          <div className="text-[11px] font-bold mt-1 truncate max-w-full font-mono">
                            {localizedStepLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-3xl p-12 text-center min-h-[500px] transition-colors duration-300 ${
              resolvedTheme === 'dark' ? 'border-white/10 bg-[#0c0c0e]' : 'border-slate-200 bg-white shadow-md'
            }`}>
              <Music className={`w-16 h-16 mb-4 animate-bounce ${resolvedTheme === 'dark' ? 'text-white/10' : 'text-slate-300'}`} />
              <h3 className={`text-xl font-light ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {translations[uiLang].noProject}
              </h3>
              <p className={`text-xs mt-1 max-w-md leading-relaxed ${
                resolvedTheme === 'dark' ? 'text-white/40' : 'text-slate-500'
              }`}>
                {translations[uiLang].noProjectDesc}
              </p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
