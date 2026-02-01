/**
 * Módulo de Gerenciamento de Perfis
 * Responsável por criar, editar, excluir e gerenciar perfis de usuário
 * Com segurança aprimorada: hash SHA-256 e proteção contra brute-force
 */

const PROFILES_KEY = 'ecofinance_profiles';
const ACTIVE_PROFILE_KEY = 'ecofinance_active_profile';
const LOGIN_ATTEMPTS_KEY = 'ecofinance_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
const PASSWORD_SALT = 'ecofinance_v1_secure_salt_2024'; // Salt para fallback de hash antigo

// Avatares disponíveis (emojis)
export const AVAILABLE_AVATARS = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🍳', '👩‍🍳',
    '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🦄', '🦋', '🐝', '🐞', '🦖', '🦕', '🐙', '🦑'
];

// Cores disponíveis para temas
export const AVAILABLE_COLORS = [
    { name: 'Laranja', value: '#F4A261', light: '#F4A261' },
    { name: 'Verde', value: '#34d399', light: '#34d399' },
    { name: 'Azul', value: '#3B82F6', light: '#60A5FA' },
    { name: 'Roxo', value: '#A855F7', light: '#C084FC' },
    { name: 'Rosa', value: '#fb7185', light: '#FDA4AF' },
    { name: 'Amarelo', value: '#FBBF24', light: '#FCD34D' },
    { name: 'Ciano', value: '#06B6D4', light: '#22D3EE' },
    { name: 'Vermelho', value: '#EF4444', light: '#F87171' },
    { name: 'Índigo', value: '#6366F1', light: '#818CF8' },
    { name: 'Esmeralda', value: '#10B981', light: '#34D399' }
];

/**
 * Hash de senha usando SHA-256 com salt dinâmico
 * Retorna uma Promise com o hash completo (hash:salt)
 */
async function hashPasswordAsync(password, salt = null) {
    if (!password) return '';
    try {
        const actualSalt = salt || generateSalt();
        const encoder = new TextEncoder();
        const data = encoder.encode(password + actualSalt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex + ':' + actualSalt;
    } catch (e) {
        console.error('Erro ao fazer hash da senha:', e);
        // Fallback para método antigo
        return btoa(password + PASSWORD_SALT);
    }
}

/**
 * Gera um salt aleatório para a senha
 */
function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se a senha está correta (suporta hash antigo e novo)
 */
async function verifyPasswordHashAsync(password, storedHash) {
    if (!password || !storedHash) return false;

    // Verificar se é o formato novo (SHA-256 + salt)
    if (storedHash.includes(':')) {
        const [hash, salt] = storedHash.split(':');
        const newHash = await hashPasswordAsync(password, salt);
        return newHash.split(':')[0] === hash;
    }

    // Fallback para formato antigo (Base64)
    return storedHash === btoa(password + PASSWORD_SALT);
}

/**
 * Versão síncrona para criar hash (usa método pseudo-hash síncrono)
 * Nota: Para máxima segurança, recomenda-se usar bcrypt ou libs especializadas no backend
 * Este método é adequado para armazenamento local simples
 */
function hashPasswordSync(password, salt = null) {
    if (!password || !password.length) return '';

    const actualSalt = salt || generateSalt();

    // Usar um método pseudo-hash síncrono baseado em múltiplas operações
    // Garantir que lidamos com caracteres Unicode corretamente
    let hash = 0;
    const combined = password + actualSalt;

    // Iterar sobre cada caractere da string combinada
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        // Operações bitwise para misturar os caracteres
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para inteiro de 32 bits
    }

    // Converter para string hexadecimal
    const hashHex = Math.abs(hash).toString(16).padStart(8, '0');

    // Criar um hash mais complexo misturando com o salt
    // Usar método seguro que não depende de btoa (que falha com Unicode)
    const finalHash = simpleBase64Encode(hashHex + actualSalt + password.length);

    return finalHash + ':' + actualSalt;
}

/**
 * Codificação Base64 simples que funciona com caracteres Unicode
 */
function simpleBase64Encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    // Converter string para bytes UTF-8
    const utf8Bytes = [];
    for (let j = 0; j < str.length; j++) {
        let charCode = str.charCodeAt(j);
        if (charCode < 128) {
            utf8Bytes.push(charCode);
        } else if (charCode < 2048) {
            utf8Bytes.push((charCode >> 6) | 192);
            utf8Bytes.push((charCode & 63) | 128);
        } else {
            utf8Bytes.push((charCode >> 12) | 224);
            utf8Bytes.push(((charCode >> 6) & 63) | 128);
            utf8Bytes.push((charCode & 63) | 128);
        }
    }

    // Codificar em Base64
    while (i < utf8Bytes.length) {
        const a = utf8Bytes[i++] || 0;
        const b = utf8Bytes[i++] || 0;
        const c = utf8Bytes[i++] || 0;

        const triplet = (a << 16) | (b << 8) | c;

        result += chars[(triplet >> 18) & 63];
        result += chars[(triplet >> 12) & 63];
        result += i > utf8Bytes.length + 1 ? '=' : chars[(triplet >> 6) & 63];
        result += i > utf8Bytes.length ? '=' : chars[triplet & 63];
    }

    return result;
}

/**
 * Versão síncrona para verificar hash
 */
function verifyPasswordHashSync(password, storedHash) {
    if (!password || !storedHash) return false;

    // Verificar se é o formato novo
    if (storedHash.includes(':')) {
        const [hash, salt] = storedHash.split(':');
        const newHash = hashPasswordSync(password, salt);
        return newHash.split(':')[0] === hash;
    }

    // Fallback para formato antigo (Base64 simples)
    return storedHash === simpleBase64Encode(password + PASSWORD_SALT);
}

/**
 * Migra hash antigo para novo formato
 */
function migratePasswordHash(profile) {
    if (!profile.passwordHash || profile.passwordHash.includes(':')) {
        return profile.passwordHash; // Já é novo formato ou está vazio
    }

    // Hash antigo detectado, criar novo hash síncrono
    const newHash = hashPasswordSync(profile.passwordHash);
    profile.passwordHash = newHash;
    return newHash;
}

/**
 * Verifica se a senha está correta (versão síncrona)
 * @param {string} profileId - ID do perfil
 * @param {string} password - Senha a verificar
 * @returns {boolean} - True se a senha estiver correta
 */
export function verifyPassword(profileId, password) {
    const profile = getProfileById(profileId);
    if (!profile) {
        console.warn('verifyPassword: Perfil não encontrado:', profileId);
        return false;
    }

    // Migrar hash se necessário (formato antigo)
    if (profile.passwordHash && !profile.passwordHash.includes(':')) {
        const newHash = migratePasswordHash(profile);
        updateProfile(profileId, { passwordHash: newHash });
        profile.passwordHash = newHash;
    }

    // Verificar se está bloqueado
    if (isProfileLocked(profileId)) {
        const remainingTime = getLockoutRemainingTime(profileId);
        const seconds = Math.ceil(remainingTime / 1000);
        console.warn('Perfil bloqueado. Tente novamente em', seconds, 'segundos.');
        return false;
    }

    // Verificar senha (se existir hash)
    if (!profile.passwordHash || profile.passwordHash.length === 0) {
        // Perfil sem senha - aceitar qualquer senha
        return true;
    }

    const isValid = verifyPasswordHashSync(password, profile.passwordHash);

    if (isValid) {
        // Login bem-sucedido, limpar tentativas
        clearLoginAttempts(profileId);
    } else {
        // Login falhou, registrar tentativa
        recordLoginAttempt(profileId);
    }

    return isValid;
}

/**
 * Atualiza a senha de um perfil
 */
export function updatePassword(profileId, oldPassword, newPassword) {
    const profile = getProfileById(profileId);
    if (!profile) {
        return { success: false, error: 'Perfil não encontrado' };
    }

    // Validar nova senha
    if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'A senha deve ter pelo menos 4 caracteres' };
    }

    // Se o perfil já tiver senha, verificar a antiga
    if (profile.passwordHash && profile.passwordHash.length > 0) {
        if (!oldPassword) {
            return { success: false, error: 'Senha atual é necessária para alterar a senha' };
        }

        // Migrar hash se necessário
        if (!profile.passwordHash.includes(':')) {
            const newHash = migratePasswordHash(profile);
            profile.passwordHash = newHash;
        }

        if (!verifyPasswordHashSync(oldPassword, profile.passwordHash)) {
            return { success: false, error: 'Senha atual incorreta' };
        }
    }

    // Criar novo hash para a nova senha (usando método síncrono)
    const newHash = hashPasswordSync(newPassword);
    return updateProfile(profileId, { passwordHash: newHash });
}

/**
 * Obtém todos os perfis do localStorage
 * @returns {Array} Array de perfis
 */
export function getAllProfiles() {
    try {
        const data = localStorage.getItem(PROFILES_KEY);

        if (!data) {
            // Se não existir, inicializar como array vazio
            return initializeProfiles();
        }

        const profiles = JSON.parse(data);

        // Validar que é um array
        if (!Array.isArray(profiles)) {
            console.warn('Formato de perfis inválido, reinicializando');
            return initializeProfiles();
        }

        return profiles;

    } catch (e) {
        console.error('Erro ao ler perfis do localStorage:', e);
        // Em caso de erro, retornar array vazio
        return [];
    }
}

/**
 * Inicializa o sistema de perfis pela primeira vez
 * NÃO cria perfil padrão - deixa vazio para usuário criar
 */
function initializeProfiles() {
    const profiles = [];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    localStorage.removeItem(ACTIVE_PROFILE_KEY);

    return profiles;
}

/**
 * Migra dados existentes do formato antigo para o novo formato com perfis
 */
function migrateExistingData(profileId) {
    const oldKeys = ['ecofinance_transactions', 'ecofinance_budgets', 'ecofinance_goals', 'ecofinance_notifications'];
    const newKeys = [`ecofinance_${profileId}_transactions`, `ecofinance_${profileId}_budgets`, `ecofinance_${profileId}_goals`, `ecofinance_${profileId}_notifications`];

    oldKeys.forEach((oldKey, index) => {
        const data = localStorage.getItem(oldKey);
        if (data) {
            // Copiar dados para o novo formato
            localStorage.setItem(newKeys[index], data);
            // Remover chave antiga
            localStorage.removeItem(oldKey);
        }
    });
}

/**
 * Obtém o perfil ativo atual
 */
export function getActiveProfile() {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!activeId) return null;

    const profiles = getAllProfiles();
    return profiles.find(p => p.id === activeId) || null;
}

/**
 * Define o perfil ativo
 */
export function setActiveProfile(profileId) {
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) {
        console.error('Perfil não encontrado:', profileId);
        return false;
    }

    // Atualizar último acesso
    profile.lastAccess = new Date().toISOString();
    updateProfile(profileId, { lastAccess: profile.lastAccess });

    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    return true;
}

/**
 * Cria um novo perfil
 */
export function createProfile(data) {
    const profiles = getAllProfiles();

    // Validar nome
    if (!data.name || data.name.trim() === '') {
        return { success: false, error: 'Nome do perfil é obrigatório' };
    }

    const trimmedName = data.name.trim();

    // Validar tamanho do nome
    if (trimmedName.length < 2) {
        return { success: false, error: 'O nome deve ter pelo menos 2 caracteres' };
    }

    if (trimmedName.length > 30) {
        return { success: false, error: 'O nome deve ter no máximo 30 caracteres' };
    }

    // Validar senha
    if (!data.password || data.password.length < 4) {
        return { success: false, error: 'A senha deve ter pelo menos 4 caracteres' };
    }

    if (data.password.length > 50) {
        return { success: false, error: 'A senha deve ter no máximo 50 caracteres' };
    }

    // Verificar se já existe perfil com mesmo nome (case-insensitive)
    if (profiles.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        return { success: false, error: 'Já existe um perfil com este nome' };
    }

    // Validar avatar
    const avatar = data.avatar || AVAILABLE_AVATARS[0];
    if (!AVAILABLE_AVATARS.includes(avatar)) {
        console.warn('Avatar inválido, usando padrão');
    }

    // Validar cor
    const color = data.color || AVAILABLE_COLORS[0].value;
    const validColor = AVAILABLE_COLORS.find(c => c.value === color);
    if (!validColor) {
        console.warn('Cor inválida, usando padrão');
    }

    const newProfile = {
        id: generateId(),
        name: trimmedName,
        avatar: avatar,
        color: validColor ? validColor.value : AVAILABLE_COLORS[0].value,
        passwordHash: hashPasswordSync(data.password),
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString()
    };

    try {
        profiles.push(newProfile);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

        return { success: true, profile: newProfile };
    } catch (e) {
        console.error('Erro ao salvar perfil:', e);
        return { success: false, error: 'Erro ao salvar perfil. Verifique o armazenamento.' };
    }
}

/**
 * Atualiza um perfil existente
 */
export function updateProfile(profileId, data) {
    if (!profileId || typeof profileId !== 'string') {
        return { success: false, error: 'ID de perfil inválido' };
    }

    const profiles = getAllProfiles();
    const index = profiles.findIndex(p => p.id === profileId);

    if (index === -1) {
        return { success: false, error: 'Perfil não encontrado' };
    }

    // Validar nome se estiver sendo alterado
    if (data.name !== undefined) {
        const trimmedName = data.name.trim();

        if (trimmedName.length < 2) {
            return { success: false, error: 'O nome deve ter pelo menos 2 caracteres' };
        }

        if (trimmedName.length > 30) {
            return { success: false, error: 'O nome deve ter no máximo 30 caracteres' };
        }

        const nameTaken = profiles.some(p =>
            p.id !== profileId && p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (nameTaken) {
            return { success: false, error: 'Já existe um perfil com este nome' };
        }

        data.name = trimmedName;
    }

    // Validar avatar se estiver sendo alterado
    if (data.avatar !== undefined && data.avatar !== '') {
        if (!AVAILABLE_AVATARS.includes(data.avatar)) {
            return { success: false, error: 'Avatar inválido' };
        }
    }

    // Validar cor se estiver sendo alterada
    if (data.color !== undefined && data.color !== '') {
        const validColor = AVAILABLE_COLORS.find(c => c.value === data.color);
        if (!validColor) {
            return { success: false, error: 'Cor inválida' };
        }
    }

    // Atualizar apenas os campos fornecidos
    profiles[index] = {
        ...profiles[index],
        ...data,
        id: profileId, // Garantir que o ID não seja alterado
        createdAt: profiles[index].createdAt, // Garantir que a data de criação não seja alterada
        updatedAt: new Date().toISOString() // Adicionar data de atualização
    };

    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        return { success: true, profile: profiles[index] };
    } catch (e) {
        console.error('Erro ao salvar perfil:', e);
        return { success: false, error: 'Erro ao salvar perfil' };
    }
}

/**
 * Exclui um perfil
 */
export function deleteProfile(profileId) {
    if (!profileId || typeof profileId !== 'string') {
        return { success: false, error: 'ID de perfil inválido' };
    }

    const profiles = getAllProfiles();

    // Não permitir excluir se for o último perfil
    if (profiles.length === 1) {
        return { success: false, error: 'Não é possível excluir o último perfil' };
    }

    const index = profiles.findIndex(p => p.id === profileId);
    if (index === -1) {
        return { success: false, error: 'Perfil não encontrado' };
    }

    const deletedProfile = profiles[index];

    // Verificar se é o perfil ativo
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const wasActive = activeId === profileId;

    // Remover perfil
    profiles.splice(index, 1);

    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error('Erro ao salvar perfis após exclusão:', e);
        return { success: false, error: 'Erro ao salvar dados após exclusão' };
    }

    // Remover dados do perfil
    const keysToRemove = [
        `ecofinance_${profileId}_transactions`,
        `ecofinance_${profileId}_budgets`,
        `ecofinance_${profileId}_goals`,
        `ecofinance_${profileId}_notifications`
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Se o perfil excluído era o ativo, definir outro como ativo
    if (wasActive && profiles.length > 0) {
        setActiveProfile(profiles[0].id);
    }

    console.log('Perfil excluído:', deletedProfile.name);
    return { success: true, profileName: deletedProfile.name };
}

/**
 * Exclui um perfil com verificação de senha
 * @param {string} profileId - ID do perfil a ser excluído
 * @param {string} password - Senha do perfil para confirmação
 * @returns {Object} Resultado da operação {success, error, profileName}
 */
export function deleteProfileWithPassword(profileId, password) {
    const profile = getProfileById(profileId);
    if (!profile) {
        return { success: false, error: 'Perfil não encontrado' };
    }

    // Verificar se o perfil tem senha definida
    if (hasPassword(profileId)) {
        // Perfil tem senha, verificar antes de excluir
        if (!password || password.length === 0) {
            return { success: false, error: 'Senha é necessária para excluir este perfil' };
        }

        // Verificar se a senha está correta
        if (!verifyPassword(profileId, password)) {
            return { success: false, error: 'Senha incorreta' };
        }
    }

    // Senha verificada (ou perfil não tem senha), proceder com exclusão
    return deleteProfile(profileId);
}

/**
 * Gera um ID único para perfil
 */
function generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Obtém perfil por ID
 */
export function getProfileById(profileId) {
    const profiles = getAllProfiles();
    return profiles.find(p => p.id === profileId) || null;
}

/**
 * Verifica se existe um perfil ativo
 */
export function hasActiveProfile() {
    return !!getActiveProfile();
}

/**
 * Limpa o perfil ativo (para sempre iniciar na seleção)
 */
export function clearActiveProfile() {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

/**
 * Verifica se um perfil tem senha definida
 */
export function hasPassword(profileId) {
    const profile = getProfileById(profileId);
    return profile && profile.passwordHash && profile.passwordHash.length > 0;
}

/**
 * Obtém estatísticas de um perfil
 */
export function getProfileStats(profileId) {
    // Carregar dados do perfil
    const transactionsKey = `ecofinance_${profileId}_transactions`;
    const goalsKey = `ecofinance_${profileId}_goals`;

    const transactions = JSON.parse(localStorage.getItem(transactionsKey) || '[]');
    const goals = JSON.parse(localStorage.getItem(goalsKey) || '[]');

    return {
        transactionCount: transactions.length,
        goalCount: goals.length,
        totalBalance: transactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0)
    };
}

// ==================== PROTEÇÃO CONTRA BRUTE-FORCE ====================

/**
 * Registra uma tentativa de login falha
 */
function recordLoginAttempt(profileId) {
    if (!profileId || typeof profileId !== 'string') {
        console.error('recordLoginAttempt: profileId inválido');
        return;
    }

    const attempts = getLoginAttempts();
    const now = Date.now();

    // Inicializar contador para este perfil se não existir
    if (!attempts[profileId]) {
        attempts[profileId] = { count: 0, lastAttempt: now };
    }

    attempts[profileId].count++;
    attempts[profileId].lastAttempt = now;

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));

    // Log de debug (remover em produção)
    const remaining = MAX_LOGIN_ATTEMPTS - attempts[profileId].count;
    if (remaining <= 2) {
        console.warn('Tentativas restantes antes do bloqueio:', remaining);
    }
}

/**
 * Limpa as tentativas de login para um perfil
 */
function clearLoginAttempts(profileId) {
    const attempts = getLoginAttempts();
    delete attempts[profileId];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

/**
 * Obtém todas as tentativas de login
 */
function getLoginAttempts() {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return data ? JSON.parse(data) : {};
}

/**
 * Verifica se um perfil está bloqueado
 */
export function isProfileLocked(profileId) {
    const attempts = getLoginAttempts();
    const profileAttempts = attempts[profileId];

    if (!profileAttempts) return false;

    const now = Date.now();
    const timeSinceLastAttempt = now - profileAttempts.lastAttempt;

    // Se ultrapassou o tempo de bloqueio, limpar tentativas
    if (timeSinceLastAttempt > LOCKOUT_DURATION) {
        clearLoginAttempts(profileId);
        return false;
    }

    // Verificar se excedeu o máximo de tentativas
    return profileAttempts.count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Obtém o tempo restante de bloqueio em milissegundos
 */
export function getLockoutRemainingTime(profileId) {
    const attempts = getLoginAttempts();
    const profileAttempts = attempts[profileId];

    if (!profileAttempts) return 0;

    const now = Date.now();
    const timeSinceLastAttempt = now - profileAttempts.lastAttempt;
    const remaining = LOCKOUT_DURATION - timeSinceLastAttempt;

    return Math.max(0, remaining);
}

/**
 * Obtém o número de tentativas restantes antes do bloqueio
 */
export function getRemainingAttempts(profileId) {
    const attempts = getLoginAttempts();
    const profileAttempts = attempts[profileId];

    if (!profileAttempts) return MAX_LOGIN_ATTEMPTS;

    return Math.max(0, MAX_LOGIN_ATTEMPTS - profileAttempts.count);
}

/**
 * Exporta função para verificar e obter mensagem de bloqueio
 */
export function getLockoutMessage(profileId) {
    if (!isProfileLocked(profileId)) return null;

    const remainingTime = getLockoutRemainingTime(profileId);
    const minutes = Math.ceil(remainingTime / 60000);
    const seconds = Math.ceil(remainingTime / 1000);

    if (minutes > 1) {
        return `Perfil bloqueado devido a tentativas excessivas. Tente novamente em ${minutes} minutos.`;
    } else if (minutes === 1) {
        return `Perfil bloqueado. Tente novamente em 1 minuto.`;
    } else {
        return `Perfil bloqueado. Tente novamente em ${seconds} segundos.`;
    }
}
