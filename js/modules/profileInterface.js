/**
 * Profile Interface Logic
 * Handles all UI interactions for the profile system
 */

console.log('ProfileInterface.js carregado');

import * as Perfis from './perfis.js';
import { reloadProfileData } from './armazenamento.js';
import { showToast } from './uteis.js';

/**
 * Inicializa a interface de perfis
 */
export function initProfileInterface() {
    const profiles = Perfis.getAllProfiles();
    const activeProfile = Perfis.getActiveProfile();

    // Se não houver perfis, mostrar a tela de seleção e forçar criação
    if (profiles.length === 0) {
        // Não limpar perfil ativo (não há nenhum)
        showProfileSelection();
        setupProfileEventListeners();

        // Abrir automaticamente o modal de criação de perfil
        setTimeout(() => {
            openProfileModal();
        }, 300);
        return;
    }

    // Se houver um perfil ativo, verificar se ele ainda existe
    if (activeProfile) {
        const profileStillExists = profiles.some(p => p.id === activeProfile.id);
        if (profileStillExists) {
            // Perfil ativo ainda existe - ativar o app principal
            showMainApp();
            setupProfileEventListeners();
            return;
        }
    }

    // Se chegou aqui, precisa selecionar um perfil
    showProfileSelection();
    setupProfileEventListeners();
}

/**
 * Mostra a tela de seleção de perfis
 */
function showProfileSelection() {
    document.getElementById('profile-selection-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    renderProfileSelection();

    // Inicializar ícones Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        console.warn('Lucide icons não disponível');
    }
}

/**
 * Mostra o app principal
 */
function showMainApp() {
    document.getElementById('profile-selection-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateSidebarProfile();
}

/**
 * Renderiza a tela de seleção de perfis
 */
function renderProfileSelection() {
    const profiles = Perfis.getAllProfiles();
    const grid = document.getElementById('profiles-grid');

    if (!grid) return;

    grid.innerHTML = '';

    // Se não houver perfis, mostrar mensagem
    if (profiles.length === 0) {
        grid.innerHTML = `
            <div class="profile-empty-state">
                <div class="profile-empty-icon">👤</div>
                <h3 class="profile-empty-title">Nenhum perfil criado</h3>
                <p class="profile-empty-text">Crie um perfil para começar a gerenciar suas finanças</p>
            </div>
        `;
        return;
    }

    profiles.forEach(profile => {
        const stats = Perfis.getProfileStats(profile.id);

        const card = document.createElement('div');
        card.className = 'profile-card';
        card.style.setProperty('--profile-color', profile.color);
        card.setAttribute('data-profile-id', profile.id);

        card.innerHTML = `
            <div class="profile-card-avatar">${profile.avatar}</div>
            <div class="profile-card-name">${profile.name}</div>
            <div class="profile-card-stats">
                ${stats.transactionCount} transações • ${stats.goalCount} metas
            </div>
            <div class="profile-card-color-indicator"></div>
            <button class="profile-card-delete-btn" data-delete-id="${profile.id}" title="Excluir perfil">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        card.addEventListener('click', () => selectProfile(profile.id));
        grid.appendChild(card);
    });

    // Adicionar event listeners para botões de exclusão
    document.querySelectorAll('.profile-card-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const profileId = btn.getAttribute('data-delete-id');
            confirmDeleteProfile(profileId);
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Confirma e exclui um perfil
 */
function confirmDeleteProfile(profileId) {
    const profile = Perfis.getProfileById(profileId);
    if (!profile) return;

    // Verificar se o perfil tem senha
    if (Perfis.hasPassword(profileId)) {
        // Abrir modal de autenticação para exclusão
        openAuthModal(profileId, 'delete');
    } else {
        // Se não tiver senha, pedir confirmação simples
        if (confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?\n\nEsta ação não pode ser desfeita e todos os dados deste perfil serão perdidos.`)) {
            deleteProfileWithAuth(profileId);
        }
    }
}

/**
 * Exclui o perfil após autenticação bem-sucedida
 */
function deleteProfileWithAuth(profileId) {
    const result = Perfis.deleteProfile(profileId);
    if (result.success) {
        showToast('Perfil excluído com sucesso!', 'success');
        renderProfileSelection();
        renderProfilesManagement();
    } else {
        showToast(result.error || 'Erro ao excluir perfil', 'error');
    }
}

/**
 * Seleciona um perfil
 */
function selectProfile(profileId) {
    const profile = Perfis.getProfileById(profileId);
    if (!profile) return;

    // Verificar se está bloqueado
    if (Perfis.isProfileLocked(profileId)) {
        const message = Perfis.getLockoutMessage(profileId);
        showToast(message, 'error');
        return;
    }

    // Se o perfil tiver senha, abrir modal de autenticação
    if (Perfis.hasPassword(profileId)) {
        openAuthModal(profileId);
    } else {
        // Se não tiver senha (perfil migrado ou erro), tentar ativar diretamente
        activateProfile(profileId);
    }
}

/**
 * Ativa um perfil após verificação
 */
function activateProfile(profileId) {
    if (Perfis.setActiveProfile(profileId)) {
        showMainApp();
        reloadProfileData();
        // Disparar evento para atualizar toda a interface
        document.dispatchEvent(new CustomEvent('profileChanged'));
        closeAuthModal();
    } else {
        showToast('Erro ao selecionar perfil', 'error');
    }
}

/**
 * Atualiza informações do perfil na sidebar
 */
export function updateSidebarProfile() {
    const profile = Perfis.getActiveProfile();
    if (!profile) return;

    const avatarEl = document.getElementById('sidebar-profile-avatar');
    const nameEl = document.getElementById('sidebar-profile-name');

    if (avatarEl) {
        avatarEl.textContent = profile.avatar;
        avatarEl.style.background = `linear-gradient(135deg, ${profile.color}, ${adjustColor(profile.color, -20)})`;
    }

    if (nameEl) {
        nameEl.textContent = profile.name;
    }
}

/**
 * Ajusta o brilho de uma cor
 */
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Configura event listeners para perfis
 */
function setupProfileEventListeners() {
    // Botão criar perfil na tela de seleção
    const createProfileBtn = document.getElementById('create-profile-btn');
    console.log('Botão criar perfil encontrado:', !!createProfileBtn);

    if (createProfileBtn) {
        createProfileBtn.addEventListener('click', (e) => {
            console.log('Botão criar perfil clicado!');
            e.preventDefault();
            openProfileModal();
        });
    } else {
        console.error('Botão create-profile-btn não encontrado no DOM');
    }

    // Botão criar perfil na view de gerenciamento
    document.getElementById('open-profile-modal-create')?.addEventListener('click', () => {
        openProfileModal();
    });

    // Fechar modal de perfil
    document.getElementById('close-profile-modal')?.addEventListener('click', closeProfileModal);
    document.getElementById('cancel-profile-modal')?.addEventListener('click', closeProfileModal);

    // Submit do formulário de perfil
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileSubmit);

    // Submit da autenticação
    document.getElementById('profile-auth-form')?.addEventListener('submit', handleAuthSubmit);

    // Botão cancelar autenticação
    document.getElementById('cancel-auth-modal')?.addEventListener('click', closeAuthModal);

    // Dropdown de perfil na sidebar
    document.getElementById('profile-dropdown-trigger')?.addEventListener('click', toggleProfileDropdown);

    // Botão gerenciar perfis
    document.getElementById('manage-profiles-btn')?.addEventListener('click', () => {
        closeProfileDropdown();
        // Navegar para view de perfis
        if (window.router) window.router('profiles');
    });

    // Toggle de visibilidade da senha
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-dropdown-menu');
        const trigger = document.getElementById('profile-dropdown-trigger');

        if (dropdown && !dropdown.classList.contains('hidden')) {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                closeProfileDropdown();
            }
        }
    });
}

/**
 * Abre o modal de perfil
 */
function openProfileModal(profileId = null) {
    const modal = document.getElementById('modal-profile');
    const title = document.getElementById('profile-modal-title');
    const form = document.getElementById('profile-form');

    if (!modal) {
        console.error('Modal de perfil não encontrado');
        return;
    }

    // Resetar formulário
    if (form) form.reset();

    // Primeiro, mostrar o modal para que os elementos existam no DOM
    modal.classList.remove('hidden');

    // Forçar reflow para garantir que o modal está visível
    modal.offsetHeight;

    // Renderizar seletores APÓS o modal estar visível
    renderAvatarSelector();
    renderColorSelector();

    // Aguardar um ciclo de renderização antes de selecionar valores
    requestAnimationFrame(() => {
        if (profileId) {
            // Modo edição
            const profile = Perfis.getProfileById(profileId);
            if (!profile) {
                console.error('Perfil não encontrado:', profileId);
                closeProfileModal();
                return;
            }

            title.textContent = 'Editar Perfil';
            document.getElementById('profile-edit-id').value = profile.id;
            document.getElementById('profile-name-input').value = profile.name;

            // Selecionar avatar e cor
            selectAvatar(profile.avatar);
            selectColor(profile.color);

            // Ocultar campo de senha na edição
            const passwordContainer = document.getElementById('profile-password-container');
            const passwordInput = document.getElementById('profile-password-input');
            if (passwordContainer) passwordContainer.classList.add('hidden');
            if (passwordInput) passwordInput.required = false;
        } else {
            // Modo criação
            title.textContent = 'Novo Perfil';
            document.getElementById('profile-edit-id').value = '';

            // Selecionar primeiros avatar e cor como padrão
            selectAvatar(Perfis.AVAILABLE_AVATARS[0]);
            selectColor(Perfis.AVAILABLE_COLORS[0].value);

            // Mostrar campo de senha na criação
            const passwordContainer = document.getElementById('profile-password-container');
            const passwordInput = document.getElementById('profile-password-input');
            if (passwordContainer) passwordContainer.classList.remove('hidden');
            if (passwordInput) passwordInput.required = true;
        }

        // Focar no campo de nome
        const nameInput = document.getElementById('profile-name-input');
        if (nameInput) {
            requestAnimationFrame(() => nameInput.focus());
        }

        if (window.lucide) window.lucide.createIcons();
    });
}

/**
 * Fecha o modal de perfil
 */
function closeProfileModal() {
    const modal = document.getElementById('modal-profile');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('profile-form').reset();
    }
}

/**
 * Renderiza o seletor de avatares
 */
function renderAvatarSelector() {
    const container = document.getElementById('avatar-selector');
    if (!container) {
        console.error('Container avatar-selector não encontrado');
        return;
    }

    // Limpar conteúdo anterior
    container.innerHTML = '';

    // Verificar se há avatares disponíveis
    if (!Perfis.AVAILABLE_AVATARS || Perfis.AVAILABLE_AVATARS.length === 0) {
        console.error('Nenhum avatar disponível');
        container.innerHTML = '<span class="text-muted">Nenhum avatar disponível</span>';
        return;
    }

    // Renderizar cada avatar
    Perfis.AVAILABLE_AVATARS.forEach((avatar, index) => {
        const option = document.createElement('div');
        option.className = 'avatar-option';
        option.textContent = avatar;
        option.setAttribute('data-index', index);
        option.setAttribute('data-avatar', avatar);
        option.title = `Avatar ${index + 1}`;
        option.addEventListener('click', () => selectAvatar(avatar));
        container.appendChild(option);
    });

    // Inicializar ícone Lucide se disponível
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Seleciona um avatar
 * @param {string} avatar - O emoji do avatar a ser selecionado
 * @returns {boolean} - True se a seleção foi bem-sucedida
 */
function selectAvatar(avatar) {
    const avatarInput = document.getElementById('profile-avatar-input');

    if (!avatarInput) {
        console.error('Elemento profile-avatar-input não encontrado');
        return false;
    }

    // Garantir que o avatarInput tenha um valor válido
    if (!avatar) {
        avatar = Perfis.AVAILABLE_AVATARS[0];
    }

    // Remover seleção anterior de todos os avatares
    document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Encontrar e selecionar o avatar correto
    const options = document.querySelectorAll('.avatar-option');
    let found = false;

    options.forEach(option => {
        if (option.textContent === avatar) {
            option.classList.add('selected');
            avatarInput.value = avatar;
            found = true;
        }
    });

    // Se não encontrou pelo texto, tentar pelo índice
    if (!found && options.length > 0) {
        const index = Perfis.AVAILABLE_AVATARS.indexOf(avatar);
        if (index >= 0 && index < options.length) {
            options[index].classList.add('selected');
            avatarInput.value = avatar;
            found = true;
        } else if (options.length > 0) {
            // Selecionar o primeiro como fallback
            options[0].classList.add('selected');
            avatarInput.value = options[0].textContent;
            found = true;
        }
    }

    return found;
}

/**
 * Renderiza o seletor de cores
 */
function renderColorSelector() {
    const container = document.getElementById('color-selector');
    if (!container) {
        console.error('Container color-selector não encontrado');
        return;
    }

    // Limpar conteúdo anterior
    container.innerHTML = '';

    // Verificar se há cores disponíveis
    if (!Perfis.AVAILABLE_COLORS || Perfis.AVAILABLE_COLORS.length === 0) {
        console.error('Nenhuma cor disponível');
        container.innerHTML = '<span class="text-muted">Nenhuma cor disponível</span>';
        return;
    }

    // Renderizar cada cor
    Perfis.AVAILABLE_COLORS.forEach((colorObj, index) => {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.style.background = `linear-gradient(135deg, ${colorObj.value}, ${colorObj.light})`;
        option.setAttribute('data-color', colorObj.value);
        option.setAttribute('data-index', index);
        option.title = colorObj.name;
        option.addEventListener('click', () => selectColor(colorObj.value));
        container.appendChild(option);
    });

    // Inicializar ícone Lucide se disponível
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Seleciona uma cor
 * @param {string} color - O valor hex da cor a ser selecionada
 * @returns {boolean} - True se a seleção foi bem-sucedida
 */
function selectColor(color) {
    const colorInput = document.getElementById('profile-color-input');

    if (!colorInput) {
        console.error('Elemento profile-color-input não encontrado');
        return false;
    }

    // Garantir que a colorInput tenha um valor válido
    if (!color) {
        color = Perfis.AVAILABLE_COLORS[0].value;
    }

    // Remover seleção anterior de todas as cores
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Encontrar e selecionar a cor correta pelo atributo data-color
    const option = document.querySelector(`.color-option[data-color="${color}"]`);
    if (option) {
        option.classList.add('selected');
        colorInput.value = color;
        return true;
    }

    // Se não encontrou, tentar encontrar pela primeira opção
    const firstOption = document.querySelector('.color-option');
    if (firstOption) {
        const firstColor = firstOption.getAttribute('data-color');
        if (firstColor) {
            firstOption.classList.add('selected');
            colorInput.value = firstColor;
            return true;
        }
    }

    console.warn('Cor não encontrada:', color);
    return false;
}

/**
 * Manipula o submit do formulário de perfil
 */
function handleProfileSubmit(e) {
    e.preventDefault();

    const profileId = document.getElementById('profile-edit-id').value;
    const nameInput = document.getElementById('profile-name-input');
    const avatarInput = document.getElementById('profile-avatar-input');
    const colorInput = document.getElementById('profile-color-input');
    const passwordInput = document.getElementById('profile-password-input');

    // Verificar se elementos existem
    if (!nameInput || !avatarInput || !colorInput) {
        showToast('Erro: elementos do formulário não encontrados', 'error');
        console.error('Elementos do formulário não encontrados:', {
            nameInput: !!nameInput,
            avatarInput: !!avatarInput,
            colorInput: !!colorInput
        });
        return;
    }

    const name = nameInput.value.trim();
    const avatar = avatarInput.value;
    const color = colorInput.value;

    // Validações
    if (!name) {
        showToast('Nome do perfil é obrigatório', 'error');
        nameInput.focus();
        return;
    }

    if (name.length < 2) {
        showToast('O nome deve ter pelo menos 2 caracteres', 'error');
        nameInput.focus();
        return;
    }

    if (name.length > 30) {
        showToast('O nome deve ter no máximo 30 caracteres', 'error');
        nameInput.focus();
        return;
    }

    if (!avatar) {
        showToast('Selecione um avatar', 'error');
        // Tentar selecionar avatar padrão
        if (!selectAvatar(Perfis.AVAILABLE_AVATARS[0])) {
            console.error('Falha ao selecionar avatar padrão');
        }
        return;
    }

    if (!color) {
        showToast('Selecione uma cor', 'error');
        // Tentar selecionar cor padrão
        if (!selectColor(Perfis.AVAILABLE_COLORS[0].value)) {
            console.error('Falha ao selecionar cor padrão');
        }
        return;
    }

    const data = { name, avatar, color };

    if (profileId) {
        // Atualizar perfil existente (sem troca de senha por este form)
        const result = Perfis.updateProfile(profileId, data);
        if (result.success) {
            showToast('Perfil atualizado!', 'success');
            closeProfileModal();

            // Atualizar interface
            const activeProfile = Perfis.getActiveProfile();
            if (activeProfile && activeProfile.id === profileId) {
                updateSidebarProfile();
            }

            // Atualizar views se estiverem abertas
            renderProfileSelection();
            renderProfilesManagement();
        } else {
            showToast(result.error || 'Erro ao atualizar perfil', 'error');
        }
    } else {
        // Criar novo perfil - validação de senha obrigatória
        if (!passwordInput) {
            showToast('Erro: campo de senha não encontrado', 'error');
            return;
        }

        const password = passwordInput.value;

        if (!password || password.length < 4) {
            showToast('A senha deve ter pelo menos 4 caracteres', 'error');
            passwordInput.focus();
            return;
        }

        if (password.length > 50) {
            showToast('A senha deve ter no máximo 50 caracteres', 'error');
            passwordInput.focus();
            return;
        }

        data.password = password;

        // Mostrar indicador de carregamento no botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        let originalText = 'Salvar Perfil';
        if (submitBtn) {
            originalText = submitBtn.textContent;
            submitBtn.textContent = 'Salvando...';
            submitBtn.disabled = true;
        }

        try {
            const result = Perfis.createProfile(data);

            if (result.success) {
                showToast('Perfil criado com sucesso!', 'success');
                closeProfileModal();
                renderProfileSelection();
                renderProfilesManagement();

                // Disparar evento para notificar criação do perfil
                document.dispatchEvent(new CustomEvent('profileCreated', { detail: result.profile }));
            } else {
                showToast(result.error || 'Erro ao criar perfil', 'error');
            }
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
            showToast('Erro interno ao criar perfil. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }
}

/**
 * Abre o modal de autenticação
 * @param {string} profileId - ID do perfil
 * @param {string} action - Ação após autenticação ('login' ou 'delete')
 */
function openAuthModal(profileId, action = 'login') {
    const profile = Perfis.getProfileById(profileId);
    if (!profile) return;

    const modal = document.getElementById('modal-profile-auth');
    if (!modal) return;

    document.getElementById('auth-profile-id').value = profile.id;
    document.getElementById('auth-profile-name').textContent = profile.name;
    document.getElementById('auth-profile-avatar').textContent = profile.avatar;
    document.getElementById('auth-password-input').value = '';
    document.getElementById('auth-action').value = action;

    // Atualizar mensagem e botão conforme a ação
    const messageEl = document.getElementById('auth-modal-message');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (action === 'delete' || action === 'delete_profile') {
        messageEl.textContent = `Digite a senha do perfil "${profile.name}" para confirmar a exclusão. Esta ação não pode ser desfeita.`;
        submitBtn.textContent = 'Confirmar Exclusão';
        submitBtn.style.background = '#dc2626'; // Vermelho para perigo
    } else {
        messageEl.textContent = `Digite sua senha para acessar este perfil`;
        submitBtn.textContent = 'Entrar';
        submitBtn.style.background = ''; // Resetar cor
    }

    modal.classList.remove('hidden');
    document.getElementById('auth-password-input').focus();
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Fecha o modal de autenticação
 */
function closeAuthModal() {
    const modal = document.getElementById('modal-profile-auth');
    if (modal) {
        modal.classList.add('hidden');
    }
    // Resetar botão para estado padrão
    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) {
        submitBtn.style.background = '';
    }
}

/**
 * Manipula a autenticação de perfil
 */
function handleAuthSubmit(e) {
    e.preventDefault();
    const profileId = document.getElementById('auth-profile-id').value;
    const password = document.getElementById('auth-password-input').value;
    const action = document.getElementById('auth-action').value;

    // Verificar se está bloqueado antes de tentar
    if (Perfis.isProfileLocked(profileId)) {
        const message = Perfis.getLockoutMessage(profileId);
        showToast(message, 'error');
        document.getElementById('auth-password-input').value = '';
        return;
    }

    if (action === 'delete_profile') {
        // Ação de exclusão - usar verificação específica
        const result = Perfis.deleteProfileWithPassword(profileId, password);
        closeAuthModal();
        if (result.success) {
            showToast('Perfil "' + result.profileName + '" excluído com sucesso', 'success');
            renderProfilesManagement();
            updateSidebarProfile();
            renderProfileSelection();
        } else {
            showToast(result.error, 'error');
        }
    } else if (Perfis.verifyPassword(profileId, password)) {
        closeAuthModal();
        if (action === 'delete') {
            // Confirmação final antes de excluir (para action 'delete' legada)
            const profile = Perfis.getProfileById(profileId);
            if (confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?\n\nEsta ação não pode ser desfeita e todos os dados deste perfil serão perdidos.`)) {
                deleteProfileWithAuth(profileId);
            }
        } else {
            activateProfile(profileId);
        }
    } else {
        const remainingAttempts = Perfis.getRemainingAttempts(profileId);

        if (remainingAttempts === 0) {
            const message = Perfis.getLockoutMessage(profileId);
            showToast(message, 'error');
        } else {
            showToast(`Senha incorreta. Tentativas restantes: ${remainingAttempts}`, 'error');
        }

        const input = document.getElementById('auth-password-input');
        input.value = '';
        input.focus();
    }
}

/**
 * Toggle do dropdown de perfis
 */
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown-menu');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        renderProfileDropdown();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

/**
 * Fecha o dropdown de perfis
 */
function closeProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown-menu');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

/**
 * Renderiza o dropdown de perfis
 */
function renderProfileDropdown() {
    const list = document.getElementById('profile-dropdown-list');
    if (!list) return;

    const profiles = Perfis.getAllProfiles();
    const activeProfile = Perfis.getActiveProfile();

    list.innerHTML = '';

    profiles.forEach(profile => {
        const item = document.createElement('div');
        item.className = 'profile-dropdown-item';
        if (activeProfile && profile.id === activeProfile.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="profile-avatar" style="background: linear-gradient(135deg, ${profile.color}, ${adjustColor(profile.color, -20)}); width: 36px; height: 36px; font-size: 1.25rem;">
                ${profile.avatar}
            </div>
            <div class="profile-info">
                <span class="profile-name">${profile.name}</span>
            </div>
        `;

        item.addEventListener('click', () => {
            if (activeProfile && profile.id !== activeProfile.id) {
                switchProfile(profile.id);
            }
            closeProfileDropdown();
        });

        list.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Troca o perfil ativo
 */
function switchProfile(profileId) {
    // Usar selectProfile para garantir que a senha seja solicitada se necessário
    selectProfile(profileId);
}

/**
 * Renderiza a view de gerenciamento de perfis
 */
export function renderProfilesManagement() {
    const container = document.getElementById('profiles-management-grid');
    if (!container) return;

    const profiles = Perfis.getAllProfiles();
    const activeProfile = Perfis.getActiveProfile();

    container.innerHTML = '';

    profiles.forEach(profile => {
        const stats = Perfis.getProfileStats(profile.id);
        const isActive = activeProfile && profile.id === activeProfile.id;

        const card = document.createElement('div');
        card.className = 'profile-management-card';
        card.style.setProperty('--profile-color', profile.color);

        card.innerHTML = `
            <div class="profile-management-header">
                <div class="profile-management-avatar">${profile.avatar}</div>
                <div class="profile-management-info">
                    <h4>${profile.name}</h4>
                    <span class="text-xs text-muted">${isActive ? '✓ Ativo' : 'Inativo'}</span>
                </div>
            </div>

            <div class="profile-management-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value">${stats.transactionCount}</div>
                    <div class="profile-stat-label">Transações</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${stats.goalCount}</div>
                    <div class="profile-stat-label">Metas</div>
                </div>
            </div>

            <div class="profile-management-actions">
                ${!isActive ? `<button class="btn-secondary" data-action="activate" data-id="${profile.id}">Ativar</button>` : ''}
                <button class="btn-secondary" data-action="edit" data-id="${profile.id}">Editar</button>
                ${profiles.length > 1 ? `<button class="btn-secondary text-red" data-action="delete" data-id="${profile.id}">Excluir</button>` : ''}
            </div>
        `;

        container.appendChild(card);
    });

    // Event listeners para ações
    container.querySelectorAll('[data-action="activate"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            switchProfile(id);
            renderProfilesManagement();
        });
    });

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openProfileModal(id);
        });
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteProfile(id);
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Exclui um perfil
 */
function deleteProfile(profileId) {
    const profile = Perfis.getProfileById(profileId);
    if (!profile) return;

    // Verificar se o perfil tem senha
    if (Perfis.hasPassword(profileId)) {
        // Tem senha - mostrar modal de autenticação para confirmação
        showDeleteConfirmationModal(profileId);
    } else {
        // Não tem senha - confirmação simples
        if (confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?\n\nTodos os dados deste perfil serão perdidos permanentemente.`)) {
            const result = Perfis.deleteProfile(profileId);
            if (result.success) {
                showToast('Perfil excluído', 'success');
                renderProfilesManagement();
                updateSidebarProfile();
                renderProfileSelection();
            } else {
                showToast(result.error, 'error');
            }
        }
    }
}

/**
 * Mostra o modal de confirmação de exclusão com campo de senha
 */
function showDeleteConfirmationModal(profileId) {
    const profile = Perfis.getProfileById(profileId);
    if (!profile) return;

    const modal = document.getElementById('modal-profile-auth');
    const avatarEl = document.getElementById('auth-profile-avatar');
    const nameEl = document.getElementById('auth-profile-name');
    const messageEl = document.getElementById('auth-modal-message');
    const submitBtn = document.getElementById('auth-submit-btn');
    const profileIdInput = document.getElementById('auth-profile-id');
    const actionInput = document.getElementById('auth-action');
    const passwordInput = document.getElementById('auth-password-input');

    // Configurar para modo de exclusão
    avatarEl.textContent = profile.avatar || '👤';
    nameEl.textContent = profile.name;
    messageEl.textContent = 'Digite sua senha para confirmar a exclusão deste perfil. Esta ação não pode ser desfeita.';
    submitBtn.textContent = 'Confirmar Exclusão';
    submitBtn.style.background = '#dc2626'; // Vermelho para perigo
    profileIdInput.value = profileId;
    actionInput.value = 'delete_profile';
    passwordInput.value = '';
    passwordInput.focus();

    modal.classList.remove('hidden');
}

/**
 * Processa a autenticação do modal de confirmação de exclusão
 */
function handleDeleteConfirmation(profileId, password) {
    const result = Perfis.deleteProfileWithPassword(profileId, password);

    if (result.success) {
        showToast('Perfil "' + result.profileName + '" excluído com sucesso', 'success');
        renderProfilesManagement();
        updateSidebarProfile();
        renderProfileSelection();
    } else {
        showToast(result.error, 'error');
    }
}
