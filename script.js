// Configuração
const API_BASE = 'https://site-unidadepolo-production.up.railway.app/api';
let authHeader = '';

// ===== FUNÇÕES PRINCIPAIS =====

// Carregar galeria do servidor
async function carregarGaleriaSite() {
    try {
        const response = await fetch(`${API_BASE}/gallery`);
        const data = await response.json();

        if (data.success) {
            const galeriaPrincipal = document.querySelector('.galeria-grid');
            galeriaPrincipal.innerHTML = '';

            data.images.forEach(imagem => {
                const item = document.createElement('div');
                item.className = 'galeria-item';
                
                const img = document.createElement('img');
                img.src = `http://localhost:3000${imagem.url}`;
                img.alt = imagem.originalName;
                img.loading = 'lazy';
                
                item.appendChild(img);
                galeriaPrincipal.appendChild(item);
            });
        }
    } catch (error) {
        console.log('Erro ao carregar galeria:', error);
    }
}

// Upload direto para o site
async function fazerUpload(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_BASE}/gallery`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // Atualiza o site automaticamente
            await carregarGaleriaSite();
            
            // Feedback
            const uploadStatus = document.getElementById('uploadStatus');
            if (uploadStatus) {
                uploadStatus.textContent = '✅ ' + data.message;
                uploadStatus.style.color = 'var(--verde)';
                
                setTimeout(() => {
                    uploadStatus.textContent = '';
                }, 3000);
            }
            
            return true;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        
        const uploadStatus = document.getElementById('uploadStatus');
        if (uploadStatus) {
            uploadStatus.textContent = '❌ Erro: ' + error.message;
            uploadStatus.style.color = 'var(--vermelho)';
        }
        
        return false;
    }
}

// ===== EVENTOS E INICIALIZAÇÃO =====

// Menu Mobile
document.querySelector('.mobile-menu').addEventListener('click', function() {
    document.querySelector('nav ul').classList.toggle('active');
});

// Fechar menu mobile
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelector('nav ul').classList.remove('active');
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// ===== PAINEL ADMIN =====

const adminBtn = document.getElementById('adminBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const logoutBtn = document.getElementById('logoutBtn');

// Abrir modal de login
adminBtn.addEventListener('click', function() {
    loginForm.reset();
    loginModal.style.display = 'flex';
});

// Fechar modal
closeModal.addEventListener('click', function() {
    loginModal.style.display = 'none';
});

loginModal.addEventListener('click', function(e) {
    if(e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Login
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Salvar credenciais
            authHeader = 'Basic ' + btoa(username + ':' + password);
            
            loginModal.style.display = 'none';
            adminPanel.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Carregar dados atuais
            await carregarDadosAdmin();
            
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Erro ao conectar com o servidor');
    }
});

// Logout
logoutBtn.addEventListener('click', function() {
    adminPanel.style.display = 'none';
    document.body.style.overflow = 'auto';
    authHeader = '';
    loginForm.reset();
});

// Carregar dados no painel admin
async function carregarDadosAdmin() {
    await carregarGaleriaAdmin();
}

// Carregar galeria no painel admin
async function carregarGaleriaAdmin() {
    try {
        const response = await fetch(`${API_BASE}/gallery`);
        const data = await response.json();

        if (data.success) {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = '';

            data.images.forEach(imagem => {
                adicionarImagemPreview(imagem);
            });
        }
    } catch (error) {
        console.log('Erro ao carregar galeria admin:', error);
    }
}
// ===== FUNÇÕES PARA CAMPEONATOS =====

// Carregar campeonatos no painel admin (com botões de delete)
// Carregar campeonatos no painel admin (com event listeners)
async function carregarCampeonatosAdmin() {
    try {
        const response = await fetch(`${API_BASE}/championships`);
        const data = await response.json();

        if (data.success) {
            const campeonatosContainer = document.getElementById('campeonatos-lista');
            if (campeonatosContainer) {
                campeonatosContainer.innerHTML = '';
                
                data.championships.forEach(campeonato => {
                    const item = document.createElement('div');
                    item.className = 'admin-campeonato-item';
                    item.innerHTML = `
                        <div class="campeonato-info">
                            <h4>${campeonato.title} (${campeonato.year})</h4>
                            <p>${campeonato.description}</p>
                        </div>
                        <button class="btn btn-danger" data-id="${campeonato.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    `;
                    campeonatosContainer.appendChild(item);
                });

                // Adicionar event listeners aos botões
                document.querySelectorAll('.btn-danger').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        deletarCampeonato(id);
                    });
                });
            }
        }
    } catch (error) {
        console.log('Erro ao carregar campeonatos admin:', error);
    }
}

// Deletar campeonato (função normal)
async function deletarCampeonato(id) {
    if (!confirm('Tem certeza que deseja deletar este campeonato?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/championships/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Atualizar a lista no admin
            await carregarCampeonatosAdmin();
            
            // Atualizar o site
            await carregarCampeonatosSite();
            
            alert('✅ Campeonato deletado com sucesso!');
        } else {
            alert('❌ Erro: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao deletar campeonato:', error);
        alert('❌ Erro ao deletar campeonato');
    }
}
// Formulário de Campeonatos
document.getElementById('campeonatoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value;
    const ano = document.getElementById('ano').value;
    const descricao = document.getElementById('descricao').value;
    const imagemInput = document.getElementById('imagemCampeonato');
    
    const formData = new FormData();
    formData.append('title', titulo);
    formData.append('year', ano);
    formData.append('description', descricao);
    
    if (imagemInput.files[0]) {
        formData.append('image', imagemInput.files[0]);
    }
    
    // Mostrar loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adicionando...';
    submitBtn.disabled = true;
    
    // Fazer upload
    const success = await fazerUploadCampeonato(formData);
    
    // Restaurar botão
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
    if (success) {
        // Opcional: atualizar a lista de campeonatos no site
        // await carregarCampeonatosSite();
    }
});
// Upload de campeonato
async function fazerUploadCampeonato(formData) {
    try {
        const response = await fetch(`${API_BASE}/championships`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Campeonato adicionado com sucesso!');
            document.getElementById('campeonatoForm').reset();
            return true;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Erro no upload do campeonato:', error);
        alert('❌ Erro: ' + error.message);
        return false;
    }
}
// Carregar campeonatos no site principal
async function carregarCampeonatosSite() {
    try {
        const response = await fetch(`${API_BASE}/championships`);
        const data = await response.json();

        if (data.success && data.championships.length > 0) {
            const campeonatosGrid = document.querySelector('.campeonatos-grid');
            campeonatosGrid.innerHTML = '';

            data.championships.forEach(campeonato => {
                const card = document.createElement('div');
                card.className = 'campeonato-card';
                
                card.innerHTML = `
                    <div class="campeonato-img">
                        <img src="http://localhost:3000${campeonato.image || '/uploads/default-campeonato.jpg'}" alt="${campeonato.title}">
                    </div>
                    <div class="campeonato-info">
                        <h3>${campeonato.title}</h3>
                        <p>${campeonato.description}</p>
                        <span class="status-badge status-active">${campeonato.year}</span>
                    </div>
                `;
                
                campeonatosGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.log('Erro ao carregar campeonatos:', error);
    }
}

// Atualizar a inicialização para carregar campeonatos também
document.addEventListener('DOMContentLoaded', function() {
    carregarGaleriaSite();
    carregarCampeonatosSite(); // ← ADICIONE ESTA LINHA
});
// Atualizar a função carregarDadosAdmin para incluir campeonatos
async function carregarDadosAdmin() {
    await carregarGaleriaAdmin();
    await carregarCampeonatosAdmin();
}
// Adicionar imagem ao preview do admin
function adicionarImagemPreview(imagem) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.dataset.id = imagem.id;
    
    const img = document.createElement('img');
    img.src = `http://localhost:3000${imagem.url}`;
    img.alt = imagem.originalName;
    
    const previewActions = document.createElement('div');
    previewActions.className = 'preview-actions';
    
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'preview-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', () => deletarImagem(imagem.id));
    
    previewActions.appendChild(deleteBtn);
    previewItem.appendChild(img);
    previewItem.appendChild(previewActions);
    
    document.getElementById('imagePreview').appendChild(previewItem);
}

// Deletar imagem
async function deletarImagem(id) {
    if (!confirm('Tem certeza que deseja deletar esta imagem do site?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/gallery/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remover do preview
            document.querySelector(`.preview-item[data-id="${id}"]`).remove();
            
            // Atualizar site
            await carregarGaleriaSite();
            
            // Feedback
            const uploadStatus = document.getElementById('uploadStatus');
            if (uploadStatus) {
                uploadStatus.textContent = '✅ Imagem deletada do site!';
                uploadStatus.style.color = 'var(--verde)';
                
                setTimeout(() => {
                    uploadStatus.textContent = '';
                }, 3000);
            }
        }
    } catch (error) {
        console.error('Erro ao deletar imagem:', error);
    }
}

// ===== UPLOAD DE IMAGENS =====

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

// Clique na área de upload
uploadArea.addEventListener('click', function() {
    fileInput.click();
});

// Arrastar e soltar
uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = 'var(--azul)';
    this.style.backgroundColor = 'rgba(43, 79, 129, 0.05)';
});

uploadArea.addEventListener('dragleave', function() {
    this.style.borderColor = '#dee2e6';
    this.style.backgroundColor = 'var(--cinza)';
});

uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '#dee2e6';
    this.style.backgroundColor = 'var(--cinza)';
    
    const files = e.dataTransfer.files;
    processarArquivos(files);
});

// Seleção de arquivos
fileInput.addEventListener('change', function() {
    processarArquivos(this.files);
});

// Processar arquivos selecionados
async function processarArquivos(files) {
    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            alert('❌ Apenas arquivos de imagem são permitidos!');
            continue;
        }
        
        await fazerUpload(file);
    }
    
    // Limpar input
    fileInput.value = '';
}

// ===== FORMULÁRIO DE CONTATO =====

// 📧 FORMULÁRIO DE CONTATO (REDIRECIONA PARA GMAIL)
document.getElementById('form-contato').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('✅ Formulário de contato submetido!');
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;
    
    console.log('📝 Dados capturados:', { nome, email, assunto, mensagem });
    
    // Validar campos
    if (!nome || !email || !assunto || !mensagem) {
        alert('❌ Por favor, preencha todos os campos.');
        return;
    }
    
    // Montar o email
    const emailBody = `
Olá, Colégio Unidade Polo!

Meu nome é ${nome} (${email}).

Assunto: ${assunto}

Mensagem:
${mensagem}

---
Enviado através do site do colégio.
    `.trim();
    
    // Codificar para URL
    const subjectEncoded = encodeURIComponent(`[Site] ${assunto}`);
    const bodyEncoded = encodeURIComponent(emailBody);
    
    // Criar URL do Gmail
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=mgaunidadepolo@seed.pr.gov.br&su=${subjectEncoded}&body=${bodyEncoded}`;
    
    console.log('🔗 URL do Gmail criada:', gmailUrl);
    
    // Abrir Gmail em nova aba
    try {
        window.open(gmailUrl, '_blank');
        console.log('✅ Gmail aberto com sucesso!');
        alert('📧 Gmail aberto! Complete o envio clicando em "Enviar".');
    } catch (error) {
        console.error('❌ Erro ao abrir Gmail:', error);
        alert('❌ Erro ao abrir Gmail. Verifique o bloqueador de pop-ups.');
    }
    
    // Limpar formulário
    this.reset();
});

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', function() {
    // Carregar galeria do site
    carregarGaleriaSite();
    
    // Configurar tabs do admin
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
});
