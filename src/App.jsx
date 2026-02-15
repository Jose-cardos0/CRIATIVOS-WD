import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = '/api';

const Icons = {
  Upload: () => (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  Video: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  Audio: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ),
  Phase: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Error: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  Waveform: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h1.5m0 0V8.25m0 3.75v3.75M6 12h1.5m0 0V6m0 6v6m3-6h1.5m0 0V9m0 3v3m3-3h1.5m0 0V7.5m0 4.5v4.5m3-4.5h1.5m0 0V9.75m0 2.25v2.25M21 12h1.5" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
};

const LANGUAGES = [
  { code: 'pt-BR', name: 'Portugues (Brasil)' },
  { code: 'pt-PT', name: 'Portugues (Portugal)' },
  { code: 'en-US', name: 'Ingles (EUA)' },
  { code: 'en-GB', name: 'Ingles (UK)' },
  { code: 'es-ES', name: 'Espanhol' },
  { code: 'fr-FR', name: 'Frances' },
  { code: 'de-DE', name: 'Alemao' },
  { code: 'it-IT', name: 'Italiano' },
];

let nextId = 1;

function App() {
  // Config compartilhada
  const [mode, setMode] = useState('white');
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(20);
  const [lang, setLang] = useState('pt-BR');
  const [noiseTypes, setNoiseTypes] = useState(['pink']);
  const [noiseEffects, setNoiseEffects] = useState([]);
  const [perturbLevel, setPerturbLevel] = useState(3);

  // Fila de videos: [{id, file, status, progress, message, jobId, downloadUrl, outputFile}]
  const [queue, setQueue] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const fileInputRef = useRef(null);
  const processingRef = useRef(false);
  const pollingTimers = useRef({});

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(pollingTimers.current).forEach(clearInterval);
    };
  }, []);

  // Processar fila automaticamente
  useEffect(() => {
    processNextInQueue();
  }, [queue]);

  const updateQueueItem = (id, updates) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Adicionar arquivos a fila
  const addFiles = (files) => {
    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
        newItems.push({
          id: nextId++,
          file,
          status: 'pending',
          progress: 0,
          message: 'Na fila...',
          jobId: null,
          downloadUrl: null,
          outputFile: null,
        });
      }
    }
    if (newItems.length === 0) {
      setGlobalError('Nenhum video valido selecionado.');
      return;
    }
    setQueue(prev => [...prev, ...newItems]);
    setGlobalError(null);
  };

  // Processar proximo da fila
  const processNextInQueue = async () => {
    if (processingRef.current) return;

    const pendingItem = queue.find(item => item.status === 'pending');
    if (!pendingItem) return;

    // Validar config
    if (mode === 'white' && text.trim().length === 0) return;

    processingRef.current = true;
    updateQueueItem(pendingItem.id, { status: 'uploading', message: 'Enviando video...', progress: 0 });

    const formData = new FormData();
    formData.append('video', pendingItem.file);
    formData.append('mode', mode);
    formData.append('volume', volume.toString());
    formData.append('perturbLevel', perturbLevel.toString());
    if (mode === 'white') {
      formData.append('text', text.trim());
      formData.append('lang', lang);
    } else {
      formData.append('noiseType', JSON.stringify({ types: noiseTypes, effects: noiseEffects }));
    }

    try {
      const response = await fetch(API_URL + '/process', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar processamento.');
      }

      updateQueueItem(pendingItem.id, { status: 'processing', jobId: data.jobId, message: 'Processando...' });
      startPolling(pendingItem.id, data.jobId);

    } catch (err) {
      updateQueueItem(pendingItem.id, { status: 'error', message: err.message });
      processingRef.current = false;
    }
  };

  // Polling de status
  const startPolling = (itemId, jobId) => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch(API_URL + '/status/' + jobId);
        const data = await response.json();

        updateQueueItem(itemId, {
          progress: data.progress || 0,
          message: data.message || 'Processando...',
        });

        if (data.status === 'completed') {
          clearInterval(timer);
          delete pollingTimers.current[itemId];
          updateQueueItem(itemId, {
            status: 'completed',
            progress: 100,
            message: 'Concluido!',
            downloadUrl: data.downloadUrl,
            outputFile: data.outputFile,
          });
          processingRef.current = false;
        } else if (data.status === 'error') {
          clearInterval(timer);
          delete pollingTimers.current[itemId];
          updateQueueItem(itemId, {
            status: 'error',
            progress: 0,
            message: data.message || 'Erro no processamento.',
          });
          processingRef.current = false;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);

    pollingTimers.current[itemId] = timer;
  };

  // Download individual
  const handleDownload = (item) => {
    if (item.downloadUrl) {
      const a = document.createElement('a');
      a.href = item.downloadUrl;
      a.download = item.outputFile || 'video_processado.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Remover item da fila
  const removeItem = (id) => {
    if (pollingTimers.current[id]) {
      clearInterval(pollingTimers.current[id]);
      delete pollingTimers.current[id];
    }
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  // Limpar finalizados
  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'error'));
  };

  // Drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isAnyProcessing = queue.some(i => i.status === 'processing' || i.status === 'uploading');
  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const completedCount = queue.filter(i => i.status === 'completed').length;
  const canStartQueue = queue.some(i => i.status === 'pending') && (mode === 'noise' || text.trim().length > 0);

  const sliderThumbClass = `w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
    [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110`;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Icons.Waveform />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Criativos WD</h1>
              <p className="text-xs text-dark-400">Phase Inverter + Audio White</p>
            </div>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-dark-400">
              {pendingCount > 0 && <span className="bg-dark-800 px-2 py-1 rounded-lg">{pendingCount} na fila</span>}
              {completedCount > 0 && <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-lg">{completedCount} concluido(s)</span>}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Como funciona */}
        <div className="glass-card gradient-border p-6">
          <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Upload', desc: 'Envie um ou varios videos criativos de uma vez' },
              { step: '2', title: 'Phase Split', desc: 'Audio original (MONO) no canal L, fase invertida no canal R. Bot soma L+R = silencio' },
              { step: '3', title: 'Audio MID', desc: 'TTS ou Ruido no canal MID. Sobrevive na soma mono — bot transcreve apenas isso' },
              { step: '4', title: 'Export', desc: 'Cada video processado fica disponivel para download individual' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* COLUNA ESQUERDA: Config */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Icons.Audio />
                <h2 className="font-semibold text-sm">Configuracao</h2>
              </div>

              {/* Toggle Modo */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('white')} disabled={isAnyProcessing}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${mode === 'white' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-600'}`}>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5 opacity-70">Modo 1</span>
                  Copy White (TTS)
                </button>
                <button onClick={() => setMode('noise')} disabled={isAnyProcessing}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${mode === 'noise' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-600'}`}>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5 opacity-70">Modo 2</span>
                  Apenas Ruido
                </button>
              </div>

              {/* White: texto + idioma */}
              {mode === 'white' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-dark-300">Texto Copy White</label>
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                      placeholder="Texto que sera convertido em audio..."
                      className="input-field min-h-[100px] resize-y text-sm" disabled={isAnyProcessing} />
                    <p className="text-[10px] text-dark-500">{text.length} caracteres</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-dark-300">Idioma</label>
                    <select value={lang} onChange={(e) => setLang(e.target.value)}
                      className="input-field text-sm" disabled={isAnyProcessing}>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Noise: tipos (multi-select) */}
              {mode === 'noise' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-dark-300">Tipos de ruido</label>
                      <span className="text-[10px] text-dark-500">Selecione 1 ou mais</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'pink', name: 'Pink', desc: 'Graves suaves' },
                        { id: 'white', name: 'White', desc: 'Uniforme' },
                        { id: 'brown', name: 'Brown', desc: 'Muito grave' },
                        { id: 'blue', name: 'Blue', desc: 'Agudo' },
                        { id: 'violet', name: 'Violet', desc: 'Bem agudo' },
                      ].map(n => {
                        const isSelected = noiseTypes.includes(n.id);
                        return (
                          <button key={n.id} disabled={isAnyProcessing}
                            onClick={() => {
                              setNoiseTypes(prev => {
                                if (isSelected && prev.length > 1) return prev.filter(x => x !== n.id);
                                if (!isSelected) return [...prev, n.id];
                                return prev;
                              });
                            }}
                            title={n.desc}
                            className={`px-1.5 py-2 rounded-lg text-[11px] font-medium transition-all border text-center ${isSelected ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-500'}`}>
                            {n.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-dark-500">
                      {noiseTypes.length > 1 ? 'Combinacao: ' + noiseTypes.join(' + ') + ' (ruidos mixados para espectro mais complexo)' : noiseTypes[0] === 'pink' ? 'Pink: energia em graves, som natural e suave' : noiseTypes[0] === 'white' ? 'White: energia uniforme, classico chuvisco' : noiseTypes[0] === 'brown' ? 'Brown: muito grave, tipo trovao distante' : noiseTypes[0] === 'blue' ? 'Blue: mais agudo, oposto do pink' : 'Violet: ultra agudo, chiado intenso'}
                    </p>
                  </div>

                  {/* Efeitos sobre o ruido */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-dark-300">Efeitos anti-ASR sobre ruido</label>
                      <span className="text-[10px] text-dark-500">Opcional</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'bandpass', name: 'Bandpass Voz', desc: 'Foca ruido na faixa 300-3400Hz (frequencia da voz humana). Maximiza interferencia com ASR.' },
                        { id: 'vibrato', name: 'Vibrato', desc: 'Modulacao de frequencia que imita padroes de fala. Confunde modelos de reconhecimento.' },
                        { id: 'tremolo', name: 'Tremolo', desc: 'Modulacao de amplitude ritmica. Cria padroes que ASR interpreta como fonemas.' },
                        { id: 'pulsate', name: 'Pulsate', desc: 'Phaser + Flanger combinados. Variacoes espectrais complexas e imprevisíveis.' },
                      ].map(fx => {
                        const isSelected = noiseEffects.includes(fx.id);
                        return (
                          <button key={fx.id} disabled={isAnyProcessing}
                            onClick={() => {
                              setNoiseEffects(prev =>
                                isSelected ? prev.filter(x => x !== fx.id) : [...prev, fx.id]
                              );
                            }}
                            title={fx.desc}
                            className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all border text-left ${isSelected ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-500'}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-purple-500 border-purple-400' : 'border-dark-600'}`}>
                                {isSelected && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </span>
                              {fx.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {noiseEffects.length > 0 && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2 space-y-1">
                        <p className="text-[10px] font-medium text-purple-300">Efeitos ativos: {noiseEffects.length}</p>
                        {noiseEffects.map(fx => (
                          <p key={fx} className="text-[10px] text-dark-400">
                            {fx === 'bandpass' && '• Bandpass: Ruido focado na faixa de voz (300-3400Hz)'}
                            {fx === 'vibrato' && '• Vibrato: Modulacao de frequencia imitando fala'}
                            {fx === 'tremolo' && '• Tremolo: Pulsos ritmicos que confundem ASR'}
                            {fx === 'pulsate' && '• Pulsate: Phaser+Flanger para variacao espectral'}
                          </p>
                        ))}
                      </div>
                    )}
                    {noiseEffects.length === 0 && (
                      <p className="text-[10px] text-dark-500">Nenhum efeito selecionado. Ruido puro sera aplicado.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Volume */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-dark-300">Volume do {mode === 'white' ? 'Copy White' : 'Ruido'} no MID</label>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{volume}%</span>
                </div>
                <input type="range" min="1" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))}
                  className={sliderThumbClass + ' [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-indigo-500/50 [&::-webkit-slider-thumb]:hover:bg-indigo-400'}
                  disabled={isAnyProcessing} />
                <div className="flex justify-between text-[10px] text-dark-500">
                  <span>1% (Mais sutil)</span>
                  <span>100% (Volume maximo)</span>
                </div>
              </div>

              {/* Perturbacao */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-dark-300">Perturbacao Anti-ASR</label>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${perturbLevel <= 2 ? 'text-green-400 bg-green-500/10' : perturbLevel <= 3 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {['', 'Sutil', 'Leve', 'Medio', 'Forte', 'Maximo'][perturbLevel]}
                  </span>
                </div>
                <input type="range" min="1" max="5" step="1" value={perturbLevel} onChange={(e) => setPerturbLevel(parseInt(e.target.value))}
                  className={sliderThumbClass + ' [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-orange-500/50 [&::-webkit-slider-thumb]:hover:bg-orange-400'}
                  disabled={isAnyProcessing} />
                <div className="flex justify-between text-[10px] text-dark-500">
                  <span>1 - Sutil</span>
                  <span>5 - Maximo</span>
                </div>
                <div className="text-[10px] text-dark-500 bg-dark-900/30 rounded-lg p-2 space-y-0.5">
                  <p><span className="text-dark-400 font-medium">Nivel 1-2:</span> Echo + Chorus (quase imperceptivel)</p>
                  <p><span className="text-dark-400 font-medium">Nivel 3:</span> + Aphaser + Tremolo (leve efeito)</p>
                  <p><span className="text-dark-400 font-medium">Nivel 4-5:</span> + Flanger + Echo duplo (maximo anti-bot)</p>
                </div>
              </div>

              {/* Info Phase */}
              <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30 space-y-2">
                <div className="flex items-start gap-2">
                  <Icons.Phase />
                  <div>
                    <p className="text-xs font-medium text-dark-300">Anti-Transcricao (Phase Split)</p>
                    <p className="text-[10px] text-dark-500 mt-0.5">
                      O audio original vai para o canal L (MONO) e a copia invertida para o canal R.
                      Quando o bot soma para mono: L + R = silencio. Humanos ouvem normalmente em estereo.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-dark-800/50 rounded-lg p-2 border border-dark-700/30">
                    <p className="font-semibold text-indigo-400">Audio Principal</p>
                    <p className="text-dark-400">MONO (L=orig, R=inv)</p>
                    <p className="text-dark-500">Volume: 100%</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-2 border border-dark-700/30">
                    <p className="font-semibold text-purple-400">{mode === 'white' ? 'Copy White (TTS)' : 'Ruido (' + noiseTypes.join('+') + ')' + (noiseEffects.length > 0 ? ' +FX' : '')}</p>
                    <p className="text-dark-400">ESTEREO (sobrevive mono)</p>
                    <p className="text-dark-500">Volume: {volume}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Upload + Fila */}
          <div className="lg:col-span-3 space-y-5">

            {/* Upload area */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Icons.Video />
                  <h2 className="font-semibold text-sm">Videos</h2>
                </div>
                {queue.length > 0 && (
                  <button onClick={clearCompleted} className="text-xs text-dark-400 hover:text-dark-300 transition-colors">
                    Limpar finalizados
                  </button>
                )}
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="video/*,.mp4,.avi,.mov,.mkv,.webm" multiple onChange={handleFileInput} className="hidden" />
                <div className="flex flex-col items-center gap-2">
                  <div className="text-dark-400"><Icons.Upload /></div>
                  <p className="text-sm font-medium text-dark-300">
                    Arraste <span className="text-indigo-400">varios videos</span> ou clique para selecionar
                  </p>
                  <p className="text-xs text-dark-500">MP4, AVI, MOV, MKV, WebM (max 2GB cada)</p>
                </div>
              </div>

              {/* Fila de videos */}
              {queue.length > 0 && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {queue.map((item, index) => (
                    <div key={item.id} className={`rounded-xl border p-3 transition-all ${
                      item.status === 'completed' ? 'bg-green-500/5 border-green-500/20' :
                      item.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                      item.status === 'processing' || item.status === 'uploading' ? 'bg-indigo-500/5 border-indigo-500/20' :
                      'bg-dark-800/30 border-dark-700/30'
                    }`}>
                      {/* Header do item */}
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-dark-800 flex items-center justify-center text-xs font-bold text-dark-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.file.name}</p>
                          <p className="text-[10px] text-dark-500">{(item.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === 'pending' && (
                            <span className="flex items-center gap-1 text-[10px] text-dark-400 bg-dark-800 px-2 py-1 rounded-lg">
                              <Icons.Clock /> Fila
                            </span>
                          )}
                          {(item.status === 'uploading' || item.status === 'processing') && (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                              <Icons.Spinner /> {item.progress}%
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <button onClick={() => handleDownload(item)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-all">
                              <Icons.Download /> Baixar
                            </button>
                          )}
                          {item.status === 'error' && (
                            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                              <Icons.Error /> Erro
                            </span>
                          )}

                          {/* Remover (so se nao esta processando) */}
                          {item.status !== 'processing' && item.status !== 'uploading' && (
                            <button onClick={() => removeItem(item.id)}
                              className="text-dark-500 hover:text-red-400 transition-colors p-1">
                              <Icons.Trash />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <div className="mt-2 space-y-1">
                          <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                              style={{ width: item.progress + '%' }} />
                          </div>
                          <p className="text-[10px] text-dark-500">{item.message}</p>
                        </div>
                      )}

                      {/* Mensagem de erro */}
                      {item.status === 'error' && (
                        <p className="mt-1.5 text-[10px] text-red-400/70">{item.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botao processar grande */}
              {pendingCount > 0 && !isAnyProcessing && (
                <div className="space-y-2">
                  <button onClick={processNextInQueue} disabled={!canStartQueue}
                    className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    INICIAR PROCESSAMENTO ({pendingCount} video{pendingCount > 1 ? 's' : ''})
                  </button>
                  {mode === 'white' && text.trim().length === 0 && (
                    <p className="text-xs text-center text-yellow-400/70 animate-pulse">
                      Atencao: Digite o texto Copy White antes de iniciar
                    </p>
                  )}
                </div>
              )}

              {isAnyProcessing && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-indigo-300">Processando...</p>
                  </div>
                  {pendingCount > 0 && (
                    <p className="text-xs text-dark-400">
                      {pendingCount} video{pendingCount > 1 ? 's' : ''} restante{pendingCount > 1 ? 's' : ''} na fila
                    </p>
                  )}
                </div>
              )}

              {queue.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-dark-500">Adicione videos acima para comecar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erro global */}
        {globalError && (
          <div className="glass-card border-red-500/30 p-4 flex items-center gap-3">
            <Icons.Error />
            <p className="text-sm text-red-400">{globalError}</p>
            <button onClick={() => setGlobalError(null)} className="ml-auto text-dark-400 hover:text-white text-lg">x</button>
          </div>
        )}
      </main>

      <footer className="border-t border-dark-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-dark-500">
          Criativos WD - Phase Inverter + Audio White Generator
        </div>
      </footer>
    </div>
  );
}

export default App;
