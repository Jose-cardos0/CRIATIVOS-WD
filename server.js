import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import https from 'https';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
const tempDir = path.join(__dirname, 'temp');

[uploadsDir, outputDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use('/output', express.static(outputDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    const ok = file.originalname.match(/\.(mp4|avi|mov|mkv|webm)$/i);
    if (ok || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de video nao suportado.'));
    }
  }
});

// ============================
// TTS (Google Translate)
// ============================

function splitTextIntoChunks(text, maxLen) {
  maxLen = maxLen || 180;
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitIndex = remaining.lastIndexOf(' ', maxLen);
    if (splitIndex === -1 || splitIndex < maxLen / 2) {
      splitIndex = maxLen;
    }
    chunks.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }
  return chunks;
}

function downloadTTSChunk(text, lang) {
  return new Promise(function (resolve, reject) {
    var shortLang = lang.split('-')[0];
    var encodedText = encodeURIComponent(text);
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=' + shortLang + '&client=tw-ob&q=' + encodedText + '&textlen=' + text.length;
    var options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      }
    };
    https.get(url, options, function (res) {
      if (res.statusCode === 301 || res.statusCode === 302) {
        var redirectUrl = res.headers.location;
        https.get(redirectUrl, options, function (res2) {
          if (res2.statusCode !== 200) {
            reject(new Error('TTS redirect falhou: ' + res2.statusCode));
            return;
          }
          var chunks = [];
          res2.on('data', function (chunk) { chunks.push(chunk); });
          res2.on('end', function () { resolve(Buffer.concat(chunks)); });
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('TTS request falhou: ' + res.statusCode));
        return;
      }
      var chunks = [];
      res.on('data', function (chunk) { chunks.push(chunk); });
      res.on('end', function () { resolve(Buffer.concat(chunks)); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function generateTTS(text, lang, outputPath) {
  console.log('[TTS] Gerando audio para: "' + text.substring(0, 50) + '..." em ' + lang);
  var chunks = splitTextIntoChunks(text, 180);
  console.log('[TTS] Texto dividido em ' + chunks.length + ' parte(s)');
  var buffers = [];
  for (var i = 0; i < chunks.length; i++) {
    console.log('[TTS] Baixando parte ' + (i + 1) + '/' + chunks.length);
    var audioBuffer = await downloadTTSChunk(chunks[i], lang);
    if (audioBuffer.length < 100) {
      throw new Error('Chunk ' + (i + 1) + ' retornou dados muito pequenos.');
    }
    buffers.push(audioBuffer);
    if (i < chunks.length - 1) {
      await new Promise(function (r) { setTimeout(r, 300); });
    }
  }
  var combined = Buffer.concat(buffers);
  fs.writeFileSync(outputPath, combined);
  console.log('[TTS] Audio salvo: ' + outputPath + ' (' + (combined.length / 1024).toFixed(1) + ' KB)');
  return outputPath;
}

// ============================
// PERTURBACAO ANTI-ASR
// ============================

function buildPerturbationFilter(level) {
  var filters = [];

  // AECHO
  var echoConfigs = {
    1: 'aecho=1.0:1.0:7:0.3',
    2: 'aecho=1.0:1.0:5|13:0.3|0.25',
    3: 'aecho=1.0:1.0:5|11|19:0.3|0.25|0.2',
    4: 'aecho=1.0:1.0:5|11|19|29:0.3|0.25|0.2|0.15',
    5: 'aecho=1.0:1.0:3|7|13|23|37:0.35|0.3|0.25|0.2|0.15',
  };
  filters.push(echoConfigs[level]);

  // CHORUS
  var chorusConfigs = {
    1: 'chorus=0.9:1.0:8:0.25:0.2:2.0',
    2: 'chorus=0.9:1.0:6|11:0.35|0.25:0.25|0.3:2.0|1.7',
    3: 'chorus=0.9:1.0:6|11|17:0.4|0.3|0.25:0.3|0.35|0.4:2.0|1.7|2.3',
    4: 'chorus=0.85:1.0:5|9|14|20:0.4|0.35|0.3|0.25:0.3|0.35|0.4|0.35:2.0|1.7|2.3|1.5',
    5: 'chorus=0.8:1.0:4|8|13|19|26:0.45|0.4|0.35|0.3|0.25:0.35|0.4|0.45|0.4|0.35:2.0|1.7|2.3|1.5|2.6',
  };
  filters.push(chorusConfigs[level]);

  // APHASER (nivel >= 2)
  if (level >= 2) {
    var aphaserConfigs = {
      2: 'aphaser=type=t:speed=0.5:decay=0.2',
      3: 'aphaser=type=t:speed=0.6:decay=0.3',
      4: 'aphaser=type=t:speed=0.8:decay=0.4',
      5: 'aphaser=type=t:speed=1.0:decay=0.5',
    };
    filters.push(aphaserConfigs[level]);
  }

  // TREMOLO (nivel >= 3)
  if (level >= 3) {
    var tremoloConfigs = {
      3: 'tremolo=f=6:d=0.12',
      4: 'tremolo=f=7:d=0.2',
      5: 'tremolo=f=8:d=0.3',
    };
    filters.push(tremoloConfigs[level]);
  }

  // FLANGER (nivel >= 4)
  if (level >= 4) {
    var flangerConfigs = {
      4: 'flanger=delay=1.5:depth=1.5:speed=0.4:width=40',
      5: 'flanger=delay=2:depth=2.5:speed=0.6:width=60',
    };
    filters.push(flangerConfigs[level]);
  }

  // NIVEL 5: echo extra
  if (level >= 5) {
    filters.push('aecho=1.0:1.0:41|53|67:0.2|0.15|0.1');
  }

  // Normalizar volume apos toda a cadeia
  filters.push('dynaudnorm=p=0.95:m=10');

  return filters.join(',');
}

// ============================
// CONSTRUCAO DE CADEIA DE RUIDO
// ============================

// noiseTypes: string com um ou mais tipos separados por '+' ex: 'pink', 'pink+blue', 'white+brown+violet'
// Efeitos sobre ruido disponiveis (via noiseEffects array): bandpass, vibrato, tremolo, pulsate
function buildNoiseChain(noiseConfig, volumeDecimal) {
  // noiseConfig pode ser:
  //   - string simples: 'pink'
  //   - combinacao: 'pink+blue'
  //   - objeto serializado JSON: '{"types":["pink","blue"],"effects":["bandpass","vibrato"]}'
  var noiseTypes = [];
  var noiseEffects = [];

  if (typeof noiseConfig === 'string') {
    try {
      var parsed = JSON.parse(noiseConfig);
      noiseTypes = parsed.types || ['pink'];
      noiseEffects = parsed.effects || [];
    } catch (e) {
      // string simples como 'pink' ou 'pink+blue'
      noiseTypes = noiseConfig.split('+').map(function(s) { return s.trim(); });
    }
  }

  var validNoises = ['pink', 'white', 'brown', 'blue', 'violet'];
  noiseTypes = noiseTypes.filter(function(n) { return validNoises.includes(n); });
  if (noiseTypes.length === 0) noiseTypes = ['pink'];

  var validEffects = ['bandpass', 'vibrato', 'tremolo', 'pulsate'];
  noiseEffects = noiseEffects.filter(function(e) { return validEffects.includes(e); });

  var filters = [];
  var ampPerNoise = volumeDecimal / noiseTypes.length;

  if (noiseTypes.length === 1) {
    // Um unico ruido
    filters.push('anoisesrc=color=' + noiseTypes[0] + ':duration=7200:amplitude=' + volumeDecimal + ',aformat=channel_layouts=mono[nsingle]');
    var currentLabel = 'nsingle';

    // Aplicar efeitos sobre o ruido
    var effectResult = applyNoiseEffects(currentLabel, noiseEffects, 's');
    if (effectResult.filters.length > 0) {
      filters = filters.concat(effectResult.filters);
      currentLabel = effectResult.outputLabel;
    }

    // Split para L e R
    filters.push('[' + currentLabel + ']asplit=2[nfinal1][nfinal2]');
  } else {
    // Multiplos ruidos - gerar cada um e mixar
    var noiseLabels = [];
    for (var i = 0; i < noiseTypes.length; i++) {
      var label = 'n' + i;
      filters.push('anoisesrc=color=' + noiseTypes[i] + ':duration=7200:amplitude=' + ampPerNoise + ',aformat=channel_layouts=mono[' + label + ']');
      noiseLabels.push('[' + label + ']');
    }

    // Mixar todos os ruidos
    filters.push(noiseLabels.join('') + 'amix=inputs=' + noiseTypes.length + ':duration=longest:dropout_transition=0,volume=' + noiseTypes.length + '.0[nmixed]');
    var currentLabel = 'nmixed';

    // Aplicar efeitos sobre o ruido mixado
    var effectResult = applyNoiseEffects(currentLabel, noiseEffects, 'm');
    if (effectResult.filters.length > 0) {
      filters = filters.concat(effectResult.filters);
      currentLabel = effectResult.outputLabel;
    }

    // Split para L e R
    filters.push('[' + currentLabel + ']asplit=2[nfinal1][nfinal2]');
  }

  return filters.join(';\n');
}

function applyNoiseEffects(inputLabel, effects, prefix) {
  var filters = [];
  var currentLabel = inputLabel;
  var idx = 0;

  for (var i = 0; i < effects.length; i++) {
    var effect = effects[i];
    var outLabel = prefix + 'fx' + idx;
    var filterStr = '';

    switch (effect) {
      case 'bandpass':
        // Foca o ruido na faixa de voz humana (300-3400Hz) para maximizar interferencia com ASR
        filterStr = 'bandpass=f=1200:width_type=h:w=2800';
        break;
      case 'vibrato':
        // Modulacao de frequencia que imita padroes de fala - confunde modelos ASR
        filterStr = 'vibrato=f=6:d=0.5';
        break;
      case 'tremolo':
        // Modulacao de amplitude ritmica - cria padroes que ASR tenta interpretar como fonemas
        filterStr = 'tremolo=f=4:d=0.6';
        break;
      case 'pulsate':
        // Combinacao de aphaser + flanger - cria variacoes complexas no espectro
        filterStr = 'aphaser=type=t:speed=0.8:decay=0.4,flanger=delay=2:depth=2:speed=0.5:width=50';
        break;
      default:
        continue;
    }

    filters.push('[' + currentLabel + ']' + filterStr + '[' + outLabel + ']');
    currentLabel = outLabel;
    idx++;
  }

  // Normalizar volume apos efeitos
  if (filters.length > 0) {
    var normLabel = prefix + 'norm';
    filters.push('[' + currentLabel + ']dynaudnorm=p=0.95:m=10[' + normLabel + ']');
    currentLabel = normLabel;
  }

  return { filters: filters, outputLabel: currentLabel };
}

// ============================
// PROCESSAMENTO DE VIDEO
// ============================

function processVideo(inputPath, ttsPath, volume, perturbLevel, midMode, noiseType, outputPath, onProgress) {
  return new Promise(function (resolve, reject) {
    var volumeDecimal = volume / 100;
    var perturbation = buildPerturbationFilter(perturbLevel);
    var complexFilter;

    if (midMode === 'noise') {
      // MODO RUIDO: sem TTS, ruido(s) gerado(s) pelo FFmpeg com efeitos opcionais
      var noiseFilters = buildNoiseChain(noiseType, volumeDecimal);
      complexFilter = [
        '[0:a]aformat=channel_layouts=mono[mono_raw]',
        '[mono_raw]' + perturbation + '[mono_perturbed]',
        '[mono_perturbed]asplit=2[orig][copy]',
        '[copy]aeval=-val(0)[inv]',
        noiseFilters,
        '[orig][nfinal1]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[left]',
        '[inv][nfinal2]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[right]',
        '[left][right]amerge=inputs=2,aformat=channel_layouts=stereo[a_final]'
      ].join(';\n');
    } else {
      // MODO WHITE: com TTS
      complexFilter = [
        '[0:a]aformat=channel_layouts=mono[mono_raw]',
        '[mono_raw]' + perturbation + '[mono_perturbed]',
        '[mono_perturbed]asplit=2[orig][copy]',
        '[copy]aeval=-val(0)[inv]',
        '[1:a]aformat=channel_layouts=mono,volume=' + volumeDecimal + ',asplit=2[tts1][tts2]',
        '[orig][tts1]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[left]',
        '[inv][tts2]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[right]',
        '[left][right]amerge=inputs=2,aformat=channel_layouts=stereo[a_final]'
      ].join(';\n');
    }

    // Salvar filtro em arquivo temporario
    var filterScriptPath = path.join(tempDir, 'filter_' + path.basename(outputPath, '.mp4') + '.txt');
    fs.writeFileSync(filterScriptPath, complexFilter, 'utf-8');

    console.log('[FFmpeg] Modo: ' + midMode + (midMode === 'noise' ? ' (' + noiseType + ')' : ''));
    console.log('[FFmpeg] Filtro:\n' + complexFilter);

    // Montar argumentos
    var ffmpegPath = ffmpegStatic;
    var args = ['-y', '-i', inputPath];

    if (midMode !== 'noise' && ttsPath) {
      args.push('-i', ttsPath);
    }

    args.push('-filter_complex_script', filterScriptPath);
    args.push('-map', '0:v');
    args.push('-map', '[a_final]');
    args.push('-c:v', 'copy');
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-shortest');
    args.push('-movflags', '+faststart');
    args.push(outputPath);

    console.log('[FFmpeg] Args: ' + args.join(' '));

    var proc = spawn(ffmpegPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    var stderrData = '';

    proc.stderr.on('data', function (data) {
      var line = data.toString();
      stderrData += line;
      var timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (timeMatch && onProgress) {
        var seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
        if (seconds > 0) {
          onProgress(Math.min(seconds, 95));
        }
      }
    });

    proc.on('close', function (code) {
      try { fs.unlinkSync(filterScriptPath); } catch (e) { /* ignore */ }
      if (code === 0) {
        console.log('[FFmpeg] Processamento concluido!');
        resolve(outputPath);
      } else {
        var lastLines = stderrData.split('\n').slice(-15).join('\n');
        console.error('[FFmpeg] Falhou com codigo ' + code + ':\n' + lastLines);
        reject(new Error('FFmpeg falhou (codigo ' + code + '):\n' + lastLines));
      }
    });

    proc.on('error', function (err) {
      try { fs.unlinkSync(filterScriptPath); } catch (e) { /* ignore */ }
      reject(err);
    });
  });
}

// ============================
// API ENDPOINTS
// ============================

var jobs = new Map();

// Middleware para tratar erros do Multer e retornar JSON
function handleUpload(req, res, next) {
  upload.single('video')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo muito grande. Limite: 2GB.' });
      }
      return res.status(400).json({ error: err.message || 'Erro no upload.' });
    }
    next();
  });
}

app.post('/api/process', handleUpload, async function (req, res) {
  var jobId = uuidv4();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum video enviado.' });
    }

    var text = req.body.text || '';
    var volume = parseInt(req.body.volume) || 20;
    var lang = req.body.lang || 'pt-BR';
    var perturbLevel = Math.max(1, Math.min(5, parseInt(req.body.perturbLevel) || 3));
    var mode = req.body.mode || 'white';
    var noiseType = req.body.noiseType || 'pink';

    // noiseType agora pode ser: string simples ('pink'), combinacao ('pink+blue'),
    // ou JSON stringificado ({"types":["pink","blue"],"effects":["bandpass","vibrato"]})
    // Validacao e feita dentro de buildNoiseChain

    if (mode === 'white' && text.trim().length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Texto para a faixa de audio white e obrigatorio.' });
    }

    jobs.set(jobId, {
      status: 'processing',
      progress: 0,
      message: 'Iniciando processamento...',
      inputFile: req.file.originalname
    });

    res.json({ jobId: jobId, message: 'Processamento iniciado!' });

    var inputPath = req.file.path;
    var ttsPath = path.join(tempDir, jobId + '_tts.mp3');
    var outputFilename = 'processed_' + jobId + '.mp4';
    var outputPath = path.join(outputDir, outputFilename);

    try {
      if (mode === 'white') {
        jobs.set(jobId, { status: 'processing', progress: 10, message: 'Gerando faixa de audio white (TTS)...', inputFile: req.file.originalname });
        await generateTTS(text.trim(), lang, ttsPath);
        console.log('[Job ' + jobId + '] Modo: WHITE | Perturbacao: ' + perturbLevel);
      } else {
        var noiseLabel = noiseType;
        try { var parsed = JSON.parse(noiseType); noiseLabel = parsed.types.join('+') + (parsed.effects.length > 0 ? ' + efeitos: ' + parsed.effects.join(', ') : ''); } catch(e) { noiseLabel = noiseType; }
        jobs.set(jobId, { status: 'processing', progress: 10, message: 'Preparando ruido (' + noiseLabel + ')...', inputFile: req.file.originalname });
        console.log('[Job ' + jobId + '] Modo: NOISE (' + noiseLabel + ') | Perturbacao: ' + perturbLevel);
      }

      jobs.set(jobId, { status: 'processing', progress: 20, message: 'Processando inversao de fase e mixagem...', inputFile: req.file.originalname });

      await processVideo(
        inputPath,
        mode === 'white' ? ttsPath : null,
        volume,
        perturbLevel,
        mode,
        noiseType,
        outputPath,
        function (percent) {
          var adjustedProgress = 20 + Math.round(percent * 0.75);
          jobs.set(jobId, {
            status: 'processing',
            progress: Math.min(adjustedProgress, 95),
            message: 'Processando video... ' + percent + '%',
            inputFile: req.file.originalname
          });
        }
      );

      jobs.set(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Processamento concluido!',
        outputFile: outputFilename,
        downloadUrl: '/output/' + outputFilename
      });

      console.log('[Job ' + jobId + '] Concluido!');

    } catch (processingError) {
      console.error('[Job ' + jobId + '] Erro: ' + processingError.message);
      jobs.set(jobId, {
        status: 'error',
        progress: 0,
        message: 'Erro: ' + processingError.message
      });
    } finally {
      [inputPath, ttsPath].forEach(function (f) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
      });
    }

  } catch (error) {
    console.error('Erro geral: ' + error.message);
    jobs.set(jobId, { status: 'error', progress: 0, message: 'Erro: ' + error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/status/:jobId', function (req, res) {
  var job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job nao encontrado.' });
  res.json(job);
});

app.get('/api/download/:filename', function (req, res) {
  var filePath = path.join(outputDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo nao encontrado.' });
  res.download(filePath);
});

app.delete('/api/cleanup/:filename', function (req, res) {
  var filePath = path.join(outputDir, req.params.filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Arquivo removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover arquivo.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, function () {
  console.log('');
  console.log('Criativos WD - Servidor rodando na porta ' + PORT);
  console.log('http://localhost:' + PORT);
  console.log('');
});
