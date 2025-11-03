const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: [
        'https://colegiounidadepolo.netlify.app',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== CONFIGURAÇÃO DO UPLOAD =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// ===== DADOS =====
let galleryImages = [];
let championships = [];

// ===== AUTENTICAÇÃO =====
const validUsers = [
  { username: 'admin', password: 'admin123' }
];

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  const user = validUsers.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  next();
};

// ===== ROTAS DA API =====

// 🔐 LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = validUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ 
      success: true, 
      message: 'Login realizado com sucesso' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Credenciais inválidas' 
    });
  }
});

// 🖼️ PEGAR GALERIA
app.get('/api/gallery', (req, res) => {
  res.json({ 
    success: true, 
    images: galleryImages 
  });
});

// 📤 UPLOAD DE IMAGEM (vai direto para o site)
app.post('/api/gallery', authenticate, upload.single('image'), (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    const newImage = {
      id: Date.now() + Math.random(),
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadDate: new Date().toISOString()
    };
    
    // Adiciona diretamente à galeria do site
    galleryImages.unshift(newImage); // Adiciona no início
    
    res.json({ 
      success: true, 
      message: 'Imagem adicionada ao site com sucesso!',
      image: newImage
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro no upload: ' + error.message });
  }
});

// 🗑️ DELETAR IMAGEM
app.delete('/api/gallery/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  const imageIndex = galleryImages.findIndex(img => img.id == id);
  
  if (imageIndex === -1) {
    return res.status(404).json({ error: 'Imagem não encontrada' });
  }
  
  const image = galleryImages[imageIndex];
  
  // Deletar arquivo físico
  try {
    const filePath = path.join(__dirname, image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Aviso: Erro ao deletar arquivo físico:', error.message);
  }
  
  // Remover da galeria
  galleryImages.splice(imageIndex, 1);
  
  res.json({ 
    success: true, 
    message: 'Imagem deletada com sucesso' 
  });
});

// 🏆 CAMPEONATOS - LISTAR
app.get('/api/championships', (req, res) => {
  res.json({ 
    success: true, 
    championships: championships 
  });
});

// 🏆 CAMPEONATOS - ADICIONAR
app.post('/api/championships', authenticate, upload.single('image'), (req, res) => {
  try {
    const { title, year, description } = req.body;
    const image = req.file;
    
    const newChampionship = {
      id: Date.now(),
      title,
      year: parseInt(year),
      description,
      image: image ? `/uploads/${image.filename}` : null,
      createdAt: new Date().toISOString()
    };
    
    championships.unshift(newChampionship);
    
    res.json({ 
      success: true, 
      championship: newChampionship 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar campeonato' });
  }
});

// 🏆 CAMPEONATOS - DELETAR
app.delete('/api/championships/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  const champIndex = championships.findIndex(c => c.id == id);
  
  if (champIndex === -1) {
    return res.status(404).json({ error: 'Campeonato não encontrado' });
  }
  
  const championship = championships[champIndex];
  
  // Deletar imagem se existir
  if (championship.image) {
    try {
      const filePath = path.join(__dirname, championship.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.log('Aviso: Erro ao deletar imagem do campeonato:', error.message);
    }
  }
  
  championships.splice(champIndex, 1);
  
  res.json({ 
    success: true, 
    message: 'Campeonato deletado com sucesso' 
  });
});

// 🏠 ROTA PADRÃO
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API do Colégio Unidade Polo',
    version: '1.0.0',
    endpoints: {
      '🔐 Login': 'POST /api/login',
      '🖼️ Galeria': 'GET /api/gallery', 
      '📤 Upload': 'POST /api/gallery',
      '🗑️ Delete imagem': 'DELETE /api/gallery/:id',
      '🏆 Listar campeonatos': 'GET /api/championships',
      '🏆 Adicionar campeonato': 'POST /api/championships',
      '🏆 Deletar campeonato': 'DELETE /api/championships/:id'
    }
  });
});

// ⚡ INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log('✨ ====================================');
  console.log('🚀  Servidor do Colégio Iniciado!');
  console.log('✨ ====================================');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads/`);
  console.log(`🔗 API: http://localhost:${PORT}/api/`);
  console.log(`🔐 Admin: http://localhost:${PORT}/api/ (user: admin, pass: admin123)`);
  console.log('✨ ====================================');
});
